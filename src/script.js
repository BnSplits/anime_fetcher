import { execSync } from "child_process";
import fs from "fs";
import { parse } from "jsonc-parser";
import path from "path";
import puppeteer from "puppeteer";
import { input, select } from "@inquirer/prompts";
import { createSpinner } from "nanospinner";
import gradient from "gradient-string";

// Fonction principale
(async () => {
  // Fonction d'input
  const Input = async (message, def = "") => {
    const result = await input({
      message: message + " :",
      default: def,
      required: true,
      theme: { prefix: "=>" },
    });

    return result;
  };

  // Fonction de select
  const Select = async (message, choices) => {
    const result = await select({
      message: message + " :",
      choices: choices,
      pageSize: 999,
      theme: {
        prefix: "=>",
        spinner: "...",
        icon: {
          cursor: " >",
        },
      },
    });

    return result;
  };

  // Fonction de confirm
  const Confirm = async (message, def = "yes") => {
    const result = await select({
      message: message,
      choices: [
        {
          name: "yes",
          value: true,
          description: false,
        },
        {
          name: "no",
          value: false,
          description: false,
        },
      ],
      default: def,
      theme: {
        prefix: "=>",
      },
    });

    return result;
  };

  console.clear();

  // Introduction
  console.log(
    gradient.pastel.multiline(
      `### Anime downloader by BananaSplit ###\n--- Utilisation du site https://anime-sama.fr ---`
    )
  );

  // Demande à l'utilisateur s'il veut avoir les épisodes aussi en local sur `/home/Animes`
  const saveLocally = await Confirm(
    "Voulez-vous conservé les épisodes téléchargés en local (/home/Animes/) ?"
  );

  // Recupère les infos de connexion au compte mega dans le fichier `infos.json`
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const infosFilePath = path.resolve(__dirname, "../infos.jsonc");

  let megaMail;
  let megaPsw;

  try {
    const data = fs.readFileSync(infosFilePath, "utf8");
    const infos = parse(data); // Utilise jsonc-parser pour lire le fichier JSONC
    megaMail = infos.mail;
    megaPsw = infos.psw;
  } catch (err) {
    console.error("Erreur:", err);
  }

  // Configure mega-cmd
  if (megaMail && megaPsw) {
    console.log("Configuration de votre compte mega...");

    try {
      execSync(`mega-login ${megaMail} ${megaPsw}`, {
        shell: "/bin/bash",
        stdio: "inherit",
      });
      console.log("Configuration réussie de votre compte mega.");
    } catch (error) {
      console.error(
        "Erreur lors de la configuration de mega-cmd :",
        error.message
      );
    }
  }

  // Lancement de Puppeteer et ouverture d'une nouvelle page
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // Boucle jusqu'à trouver un animé recherché
  let doSearch = true;
  while (doSearch) {
    try {
      let name = await Input("Entrez le nom de l'anime");
      name = name.toLowerCase().replace(/\s+/g, "-");

      const searchNameSpinner = createSpinner("Recherche en cours...").start();

      // Modifie le timeout maximum de la page (en millisecondes)
      page.setDefaultNavigationTimeout(120000);

      const url = `https://anime-sama.fr/catalogue/${name}/`;
      await page.goto(url, { waitUntil: "networkidle2" });

      // Vérification si la page existe en regardant le titre de la page
      const title = await page.title();
      const exists = title !== "Accès Introuvable";

      // Redemande le nom de l'anime si celui entré n'existe pas
      if (!exists) {
        searchNameSpinner.error({ text: "Animé non-trouvé !" });
        console.log(`Le nom de l'animé est incorrect ! Veuillez réessayer. `);
        continue;
      }
      //Redéfinition si l'anime est trouvé de doSearch
      doSearch = false;
      searchNameSpinner.success({ text: "Animé trouvé !" });

      // List des liens de redirection
      let sibnet_redirected_links = [];
      let sendvid_redirected_links = [];

      // Boucle qui va tester les possibilités du menu des saisons
      let availableSeasonsLength;
      let availableSeasonsName = [];
      let availableSeasonsLinks = [];
      for (let i = 11; i <= 13; i++) {
        try {
          let seasonMenu = `#sousBlocMilieu > div.mx-3 > div:nth-child(${i})`;
          // Recupere le nombre de saisons et films
          availableSeasonsLength = await page.$eval(
            seasonMenu,
            (el) => el.children.length - 1
          );

          // Crée la liste des saisons et films
          for (let i = 2; i < availableSeasonsLength + 2; i++) {
            let ep = i.toString();
            availableSeasonsName.push(
              await page.$eval(
                `${seasonMenu} > a:nth-child(${ep}) > div`,
                (el) => el.textContent
              )
            );
            availableSeasonsLinks.push(
              await page.$eval(
                `${seasonMenu} > a:nth-child(${ep})`,
                (el) => el.href
              )
            );
          }
          break;
        } catch (err) {
          continue;
        }
      }

      // Choisir la saison ou le film
      let seasonsChoices = availableSeasonsName.map((e) => {
        return {
          value: e,
          name: e,
          description: false,
        };
      });
      let selectedSeason = await Select(
        "Veuillez choisir la saison / le film",
        seasonsChoices
      );

      const searchAnimeSeasonSpinner = createSpinner("Patientez...").start();
      const goToSeason = await page.goto(
        availableSeasonsLinks[availableSeasonsName.indexOf(selectedSeason)],
        { waitUntil: "networkidle2" }
      );

      if (goToSeason && goToSeason.ok()) {
        searchAnimeSeasonSpinner.success({ text: "Saison / film trouvé !" });
      } else {
        searchAnimeSeasonSpinner.error({
          text: "Impossible d'accéder à la saison / le film :(",
        });
      }

      // Demande de choisir entre VF et VOSTFR si la VF est disponible
      let useVf = false;
      let isVfAvailable = await page.$eval("#switchVF", (el) =>
        el.checkVisibility()
      );
      if (isVfAvailable) {
        useVf = await Confirm(
          "La version VF est disponible ! Voulez-vous la sélectionner ?",
          false
        );
      }

      // Redirige vers la page de la VF
      if (useVf) {
        await page.goto(
          availableSeasonsLinks[
            availableSeasonsName.indexOf(selectedSeason)
          ].replace("vostfr", "vf"),
          {
            waitUntil: "networkidle2",
          }
        );
      }

      // Récupération des informations nécessaires (titre, saison, lecteurs disponibles, épisodes disponibles, nombre d'épisodes,)
      let animeTitle = await page.$eval("#titreOeuvre", (el) => el.textContent);
      let animeSeason = await page.$eval("#avOeuvre", (el) => el.textContent);

      const readerOptions = await page.$$eval(
        "#selectLecteurs > option",
        (options) => options.map((option) => option.value)
      );
      const episodeCount = await page.$$eval(
        "#selectEpisodes > option",
        (options) => options.length
      );

      // Affiche le nombre d'épisodes disponibles
      console.log(`${episodeCount} Episodes sont disponibles ! `);

      // Choix des épisodes à télécharger
      const episodesInput = await Input(
        "Entrez les épisodes à télécharger (ex: 1,5,8 ou 1-6 ou A pour tous)",
        "All"
      );

      // Formattage des épisodes choisis
      let episodeNumbers = [];
      if (
        episodesInput.toLowerCase() === "a" ||
        episodesInput.toLowerCase() === "all"
      ) {
        // Si l'utilisateur choisit 'A', ajoute tous les épisodes
        episodeNumbers = Array.from({ length: episodeCount }, (_, i) => i + 1);
      } else {
        // Divise l'entrée par les virgules et supprime les espaces
        const parts = episodesInput.split(",").map((part) => part.trim());
        for (let part of parts) {
          if (part.includes("-")) {
            // Si l'entrée contient un tiret, traite-la comme une plage d'épisodes
            const [start, end] = part.split("-").map(Number); // Divise la plage et convertit en nombres
            for (let i = start; i <= end; i++) {
              episodeNumbers.push(i); // Ajoute chaque numéro d'épisode dans la plage
            }
          } else {
            // Si l'entrée est un seul numéro d'épisode, convertit et ajoute
            episodeNumbers.push(Number(part));
          }
        }
      }
      // Boucle pour chaque épisode
      for (let ep of episodeNumbers) {
        await page.select("#selectEpisodes", "Episode " + ep.toString());

        // Boucle sur chaque option de lecteur pour trouver "sibnet" ou "sendvid"
        for (let reader of readerOptions) {
          await page.select("#selectLecteurs", reader);
          const src = await page.$eval("#playerDF", (el) =>
            el.getAttribute("src")
          );

          // Modifie le numero du nom de l'épisode
          ep = (() => {
            switch (ep.toString()) {
              case "1":
                return "01";
              case "2":
                return "02";
              case "3":
                return "03";
              case "4":
                return "04";
              case "5":
                return "05";
              case "6":
                return "06";
              case "7":
                return "07";
              case "8":
                return "08";
              case "9":
                return "09";
              default:
                return ep;
            }
          })();
          // Si le lien est trouvé alors le rajouter à la liste des liens de redirection
          if (src.includes("sibnet")) {
            sibnet_redirected_links.push(["Episode " + ep.toString(), src]);
            break;
          } else if (src.includes("sendvid")) {
            sendvid_redirected_links.push(["Episode " + ep.toString(), src]);
            break;
          }
        }
      }

      // Affichage des liens et épisode copiés
      if (sibnet_redirected_links.length !== 0) {
        console.log("Serveur sibnet: ");
        for (let link of sibnet_redirected_links) {
          console.log(` >> ${link}`);
        }
      }

      if (sendvid_redirected_links.length !== 0) {
        console.log("Serveur Sendvid: ");
        for (let link of sendvid_redirected_links) {
          console.log(` >> ${link}`);
        }
      }

      // List des liens de téléchargement
      let downloadLinks = [];

      // Redirection et copie des liens de téléchargement (sibnet)
      if (sibnet_redirected_links.length !== 0) {
        for (let link of sibnet_redirected_links) {
          await page.goto(link[1], { waitUntil: "networkidle2" });

          // Active le preload de la video
          await page.$eval("#video_html5_wrapper_html5_api", (el) =>
            el.setAttribute("preload", true)
          );

          // Surveille les requetes réseau
          const response = await page.waitForResponse(
            (response) =>
              response.request().resourceType() === "media" &&
              response.status() === 206
          );

          // Récupération du lien du média
          const mediaLink = response.url();
          console.log(` -> Lien média trouvé pour l'${link[0]}: ${mediaLink}`);

          // Injection du lien de téléchargement et du nom de l'épisode
          downloadLinks.push([link[0], mediaLink]);
        }
      }

      // Redirection et copie des liens de téléchargement (Sendvid)
      if (sendvid_redirected_links.length !== 0) {
        for (let link of sendvid_redirected_links) {
          await page.goto(link[1], { waitUntil: "networkidle2" });

          // Active le preload de la video
          await page.$eval("#video-js-video_html5_api", (el) =>
            el.setAttribute("preload", true)
          );

          // Surveille les requetes réseau
          const response = await page.waitForResponse(
            (response) =>
              response.request().resourceType() === "media" &&
              response.status() === 206
          );

          // Récupération du lien du média
          const mediaLink = response.url();
          console.log(` -> Lien média trouvé pour l'${link[0]}: ${mediaLink}`);

          // Injection du lien de téléchargement et du nom de l'épisode
          downloadLinks.push([link[0], mediaLink]);
        }
      }

      // Crée les répertoires de téléchargement des animés
      const lang = useVf ? "VF" : "VOSTFR";
      const animeFolderPath = path.resolve(
        `/app/src/Animes/${animeTitle}/${animeSeason}/${lang}`
      );
      fs.mkdirSync(animeFolderPath, { recursive: true });

      try {
        execSync(
          `mega-mkdir -p "Animes/${animeTitle}/${animeSeason}/${lang}"`,
          {
            stdio: "ignore",
          }
        );
      } catch (error) {
        if (error.status !== 54) {
          // Status 54: dossier existe déjà
          console.error(
            "Erreur lors de la création du dossier sur Mega:"
            // error,
          );
          // throw error; // Relance l'erreur si c'est autre chose
        } else {
          console.log(
            "Le dossier existe déjà sur Mega, poursuite du processus..."
          );
        }
      }

      // Fonction qui va vérifier si le fichier est déjà présent sur Mega
      const checkIfFileExistsOnMega = (filePath) => {
        try {
          const output = execSync(
            `mega-ls -a "Animes/${animeTitle}/${animeSeason}/${lang}"`,
            {
              stdio: "pipe",
              shell: "/bin/bash",
            }
          ).toString();
          return output.includes(filePath);
        } catch (error) {
          console.error(
            "Erreur lors de la vérification du fichier sur Mega:",
            error
          );
          return false;
        }
      };

      // Boucle pour télécharger chaque épisode
      downloadLinks.forEach((item) => {
        const name = item[0];
        const link = item[1];

        console.log(`Téléchargement de ${name}... `);

        // Télécharger le fichier
        execSync(
          `aria2c -x 16 -d "/app/src/Animes/${animeTitle}/${animeSeason}/${lang}" -o "${name}.mp4" "${link}" | grep --line-buffered "ETA:"`,
          {
            stdio: "inherit",
            shell: "/bin/bash",
          }
        );

        console.log("Téléchargement terminé!");

        // Envoi de l'épisode sur le compte Mega si nécessaire
        console.log(`Transfert de ${name} sur votre compte Mega... `);

        const filePath = `${name}.mp4`;
        const fileExistsOnMega = checkIfFileExistsOnMega(filePath);

        if (!fileExistsOnMega) {
          execSync(
            `mega-put -c "/app/src/Animes/${animeTitle}/${animeSeason}/${lang}/${filePath}" "Animes/${animeTitle}/${animeSeason}/${lang}"`,
            {
              stdio: "inherit",
              shell: "/bin/bash",
            }
          );
          console.log("Transfert terminé!");
        } else {
          console.log(`${name} est déjà présent sur votre compte Mega.`);
        }

        if (!saveLocally) {
          console.log(`Suppression de ${name} ! `);
          fs.unlinkSync(
            `/app/src/Animes/${animeTitle}/${animeSeason}/${lang}/${filePath}`
          );
        } else {
          console.log(" ");
        }
      });
      // Log de fin
      console.log("Téléchargement et transfert terminés !");

      // Ferme le navigateur Puppeteer
      await browser.close();

      // Arrête le processus Node.js
      process.exit(0);
    } catch (err) {
      console.log("Oops, une erreur est survenue : ");
      console.error(err);
      break;
    }
  }
})();
