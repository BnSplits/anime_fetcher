const puppeteer = require('puppeteer');
const readlineSync = require('readline-sync');
const fs = require('fs');

// Fonction pour poser une question à l'utilisateur et attendre la réponse
async function askQuestion(query) {
    return readlineSync.question(query);
}

// Fonction pour formater le nom de l'animé : minuscule et remplacer les espaces par des tirets
async function formatAnimeName(name) {
    return name.toLowerCase().replace(/\s+/g, '-');
}

// Fonction principale
async function fetchMediaLinks(animeName, episodeNumbers) {
    // Lancement de Puppeteer et ouverture d'une nouvelle page
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    const formattedName = await formatAnimeName(animeName);
    const url = `https://anime-sama.fr/catalogue/${formattedName}/`;

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Vérification si la page existe en regardant le titre de la page
    const title = await page.title();
    const exists = title !== 'Accès Introuvable';

    if (!exists) {
        console.log(`Le lien ${url} n'existe pas.`);
        await browser.close();
        return false;
    }

    // Demande la saison ou le film
    const availableSeasons = await page.$eval("#sousBlocMilieu > div.mx-3.md\\:mx-10 > div:nth-child(11)", list => list.firstChild.remove())
    console.log(`Voici les saisons et films disponibles : `)
    for(let season of availableSeasons) {
        console.log(`-> ${season.lastChild.textContent} \n`)
    }
    let selectedSeason = Number(askQuestion("Choisissez votre saison/film (ex: 1, 2, 3) "))
    if (selectedSeason < 1 || selectedSeason > availableSeasons.children.length) {
        console.log("Saison/film choisi hors du champ des possibilités! \n Sélection de la saison 1!")
        selectedSeason = 1
    }

    // Se rend à la page de la saison ou du film sélectionné
    await page.goto(availableSeasons.children[selectedSeason - 1].href, { waitUntil: 'domcontentloaded' });

    // Demande de choisir entre VF et VOSTFR s'ils sont disponible

    // Récupération des informations nécessaires (titre, saison, nombre d'épisodes)
    const animeTitle = await page.$eval("#titreOeuvre", el => el.textContent);
    const animeSeason = await page.$eval("#avOeuvre", el => el.textContent);
    const episodeCount = await page.$$eval("#selectEpisodes > option", options => options.length);

    console.log(`Titre: ${animeTitle}`);
    console.log(`Saison: ${animeSeason}`);
    console.log(`Nombre d'épisodes: ${episodeCount}`);

    let links = [];

    // Boucle sur chaque épisode spécifié par l'utilisateur
    for (let ep of episodeNumbers) {
        // Sélectionne l'épisode dans le menu déroulant
        await page.select("#selectEpisodes", ep.toString());
        let found = false;
        const readerOptions = await page.$$eval("#selectLecteurs > option", options => options.map(option => option.value));

        // Boucle sur chaque option de lecteur pour trouver "sibnet"
        for (let reader of readerOptions) {
            await page.select("#selectLecteurs", reader);
            await page.waitForTimeout(1000);

            const src = await page.$eval("#playerDF", el => el.getAttribute("src"));
            if (src.includes("sibnet")) {
                // Cliquez sur le bouton de lecture
                await page.click("#video_html5_wrapper > div.vjs-big-play-button");
                const response = await page.waitForResponse(response => 
                    response.request().resourceType() === 'media' && response.status() === 206
                );

                // Récupération du lien du média
                const mediaLink = response.url();
                console.log(`Lien média trouvé pour l'épisode ${ep}: ${mediaLink}`);
                links.push(mediaLink);
                found = true;
                break;
            }
        }

        if (!found) {
            console.log(`Aucun lecteur "sibnet" trouvé pour l'épisode ${ep}.`);
        }
    }
    await browser.close();

    // Écriture des liens dans links.json
    let data = [];
    if (fs.existsSync('links.json')) {
        data = JSON.parse(fs.readFileSync('links.json'));
    }
    data = data.concat(links);
    fs.writeFileSync('links.json', JSON.stringify(data, null, 2));

    // Écrire les informations de l'anime dans un fichier temporaire
    const tempData = {
        animeTitle: animeTitle.replace(/\s+/g, '_'),
        animeSeason: animeSeason.replace(/\s+/g, '_')
    };
    fs.writeFileSync('temp_anime_info.json', JSON.stringify(tempData, null, 2));

    return true;
}

(async () => {
    let success = false;

    // Boucle jusqu'à ce que l'utilisateur entre un nom d'animé valide (page existante)
    while (!success) {
        const animeName = askQuestion("Entrez le nom de l'animé : ");
        const episodesInput = askQuestion("Entrez les épisodes (ex: 1, 5, 8 ou 1-6 ou A pour tous) : ");
        let episodeNumbers = [];

        if (episodesInput.toLowerCase() === 'a') {
            // Si l'utilisateur choisit 'A', ajoute tous les épisodes
            episodeNumbers = Array.from({ length: episodeCount }, (_, i) => i + 1);
        } else {
            // Divise l'entrée par les virgules et supprime les espaces
            const parts = episodesInput.split(',').map(part => part.trim());
            for (let part of parts) {
                if (part.includes('-')) {
                    // Si l'entrée contient un tiret, traite-la comme une plage d'épisodes
                    const [start, end] = part.split('-').map(Number);  // Divise la plage et convertit en nombres
                    for (let i = start; i <= end; i++) {
                        episodeNumbers.push(i);  // Ajoute chaque numéro d'épisode dans la plage
                    }
                } else {
                    // Si l'entrée est un seul numéro d'épisode, convertit et ajoute
                    episodeNumbers.push(Number(part));
                }
            }
        }

        // Tente de récupérer les liens des médias pour l'anime donné
        success = await fetchMediaLinks(animeName, episodeNumbers);
    }

    readlineSync.close();
})();
