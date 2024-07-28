const puppeteer = require("puppeteer");
const readlineSync = require("readline-sync");
const fs = require("fs");

// Fonction pour poser une question à l'utilisateur et attendre la réponse
function askQuestion(query) {
  return readlineSync.question(`=> ${query}`);
}
 
// Déclaration du titre et de la saison
let animeTitle = "";
let animeSeason = "";

// List des liens de téléchargement
let download_links = [];

// List des liens de redirection 
let sibnet_redirected_links = [];
let sendvid_redirected_links = [];

// Utilisation ou non de la vf
let useVf = false;

// Fonction principale
async function main(page) {
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

  // Affiche les saisons et films displonible
  console.log(`\n Voici les saisons et films disponibles :`);
  for (let seasonName of availableSeasonsName) {
    console.log(
      ` -> [${availableSeasonsName.indexOf(seasonName) + 1}] ${seasonName}`
    );
  }
  console.log(`\n`);

  // Choisir la saison ou le film
  let selectedSeason = Number(
    askQuestion("Veuillez choisir la saison / le film (ex: 1, 2, 3, 4) : ")
  );
  if (selectedSeason < 1 || selectedSeason > availableSeasonsLength) {
    console.log("Selection de la Saison 1 (choix par défaut)");
    selectedSeason = 1;
    await page.goto(availableSeasonsLinks[0], { waitUntil: "networkidle0" });
  } else {
    await page.goto(availableSeasonsLinks[selectedSeason - 1], {
      waitUntil: "networkidle0",
    });
  }

  // Demande de choisir entre VF et VOSTFR si la VF est disponible
  let isVfAvailable = await page.$eval("#switchVF", (el) =>
    el.checkVisibility()
  );
  if (isVfAvailable) {
    useVf =
      askQuestion(
        "La version VF est disponible ! Voulez-vous la sélectionner ? (o/n) : "
      ) === "o"
        ? true
        : false;
  }

  // Redirige vers la page de la VF
  if (useVf) {
    await page.goto(
      availableSeasonsLinks[selectedSeason - 1].replace("vostfr", "vf"),
      {
        waitUntil: "networkidle0",
      }
    );
  }

  // Récupération des informations nécessaires (titre, saison, lecteurs disponibles, épisodes disponibles, nombre d'épisodes,)
  animeTitle = await page.$eval("#titreOeuvre", (el) => el.textContent);
  animeTitle = (() => {
    switch (animeTitle) {
      case "Episode 1":
        return "Episode 01";
      case "Episode 2":
        return "Episode 02";
      case "Episode 3":
        return "Episode 03";
      case "Episode 4":
        return "Episode 04";
      case "Episode 5":
        return "Episode 05";
      case "Episode 6":
        return "Episode 06";
      case "Episode 7":
        return "Episode 07";
      case "Episode 8":
        return "Episode 08";
      case "Episode 9":
        return "Episode 09";
      default:
        return animeTitle;
    }
  })();
  animeSeason = await page.$eval("#avOeuvre", (el) => el.textContent);
  const readerOptions = await page.$$eval(
    "#selectLecteurs > option",
    (options) => options.map((option) => option.value)
  );
  const episodeOptions = await page.$$eval(
    "#selectEpisodes > option",
    (options) => options.map((option) => option.value)
  );
  const episodeCount = await page.$$eval(
    "#selectEpisodes > option",
    (options) => options.length
  );

  // Affiche le nombre d'épisodes disponibles
  console.log(`\n ${episodeCount} Episodes sont disponibles ! `);

  // Choix des épisodes à télécharger
  const episodesInput = askQuestion(
    "Entrez les épisodes à télécharger (ex: 1, 5, 8 ou 1-6 ou A pour tous) : "
  ).toString();

  // Formattage des épisodes choisis
  let episodeNumbers = [];
  if (episodesInput.toLowerCase() === "a") {
    /// Si l'utilisateur choisit 'A', ajoute tous les épisodes
    episodeNumbers = Array.from({ length: episodeCount }, (_, i) => i + 1);
  } else {
    /// Divise l'entrée par les virgules et supprime les espaces
    const parts = episodesInput.split(",").map((part) => part.trim());
    for (let part of parts) {
      if (part.includes("-")) {
        // Si l'entrée contient un tiret, traite-la comme une plage d'épisodes
        const [start, end] = part.split("-").map(Number); // Divise la plage et convertit en nombres
        for (let i = start; i <= end; i++) {
          episodeNumbers.push(i); // Ajoute chaque numéro d'épisode dans la plage
        }
      } else {
        /// Si l'entrée est un seul numéro d'épisode, convertit et ajoute
        episodeNumbers.push(Number(part));
      }
    }
  }

  // Boucle pour chaque épisode
  for (let ep of episodeNumbers) {
    await page.select("#selectEpisodes", "Episode " + ep.toString());

    /// Boucle sur chaque option de lecteur pour trouver "sibnet" ou "sendvid"
    for (let reader of readerOptions) {
      await page.select("#selectLecteurs", reader);
      const src = await page.$eval("#playerDF", (el) => el.getAttribute("src"));

      /// Si le lien est trouvé alors le rajouter à la liste des liens de redirection
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
  console.log("\n");
  if (sibnet_redirected_links.length === 0) {
    console.log("Serveur sibnet : aucun lien !");
    console.log("\n");
  } else {
    console.log("Serveur sibnet: ");
    for (let link of sibnet_redirected_links) {
      console.log(` -> ${link}`);
    }
    console.log("\n");
  }

  if (sendvid_redirected_links.length === 0) {
    console.log("Serveur Sendvid : aucun lien !");
    console.log("\n");
  } else {
    console.log("Serveur Sendvid: ");
    for (let link of sendvid_redirected_links) {
      console.log(` -> ${link}`);
    }
    console.log("\n");
  }

  // Redirection et copie des liens de téléchargement (sibnet)
  if (sibnet_redirected_links.length !== 0) {
    for (let link of sibnet_redirected_links) {
      await page.goto(link[1], { waitUntil: "networkidle0" });

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
      console.log(` -> Lien média trouvé pour l'${link[0]}\n`);
      // console.log(` -> Lien média trouvé pour l'${link[0]}: ${mediaLink}\n`);

      /// Injection du lien de téléchargement et du nom de l'épisode
      download_links.push([link[0], mediaLink]);
    }
  }

  // Redirection et copie des liens de téléchargement (Sendvid)
  if (sendvid_redirected_links.length !== 0) {
    for (let link of sendvid_redirected_links) {
      await page.goto(link[1], { waitUntil: "networkidle0" });

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
      console.log(` -> Lien média trouvé pour l'${link[0]}\n`);
      // console.log(` -> Lien média trouvé pour l'${link[0]}: ${mediaLink}\n`);

      /// Injection du lien de téléchargement et du nom de l'épisode
      download_links.push([link[0], mediaLink]);
    }
  }


  const animeInfo = {
    animeTitle: animeTitle,
    animeSeason: animeSeason,
    lang: useVf ? "VF" : "VOSTFR",
  };
  fs.writeFileSync("info.json", JSON.stringify(animeInfo, null, 2));

  // Ecrit tous les liens dans le fichier links.json
  fs.writeFileSync("links.json", JSON.stringify(download_links, null, 2));
}

// Fonction auto-executrice

(async () => {
  // Lancement de Puppeteer et ouverture d'une nouvelle page
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Boucle jusqu'à trouver un animé recherché
  let doSearch = true;
  while (doSearch) {
    try {
      const name = askQuestion("Entrez le nom de l'anime : ")
        .toLowerCase()
        .replace(/\s+/g, "-");
      console.log(" Recherche en cours...");

      // Modifie le timeout maximum de la page (en millisecondes)
      page.setDefaultNavigationTimeout(60000);

      const url = `https://anime-sama.fr/catalogue/${name}/`;
      await page.goto(url, { waitUntil: "networkidle0" });

      // Vérification si la page existe en regardant le titre de la page
      const title = await page.title();
      const exists = title !== "Accès Introuvable";
      if (!exists) {
        console.log(`\nLe nom de l'animé est incorrect ! Veuillez réessayer. `);
        continue
      }
      //Redéfinition de doSearch
      doSearch = false;
      await main(page);

      // Fermeture du navigateur
      browser.close()
      break
    } catch (err) {
      console.log("Oops, une erreur est survenue : ");
      console.error(err)
      break
    }
  }
})();



