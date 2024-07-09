from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.support.ui import Select
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import readline
import json
import os
from datetime import datetime


# Fonction pour poser une question à l'utilisateur et attendre la réponse
def ask_question(query):
    return input(query)


# Fonction pour formater le nom de l'animé : minuscule et remplacer les espaces par des tirets
def format_anime_name(name):
    return name.lower().replace(" ", "-")


# Fonction principale
def fetch_media_links():
    options = Options()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-extensions")
    options.add_argument("--headless")

    service = ChromeService(
        executable_path="/path/to/chromedriver"
    )  # Update path to chromedriver
    driver = webdriver.Chrome(service=service, options=options)

    formatted_name = format_anime_name(anime_name)
    url = f"https://anime-sama.fr/catalogue/{formatted_name}/"

    # Demande les infos utiles à l'utilisateur
    anime_name = ask_question("Entrez le nom de l'animé : ")
    episodes_input = ask_question(
        "Entrez les épisodes (ex: 1, 5, 8 ou 1-6 ou A pour tous) : "
    )

    # Crée la liste des épisodes à télécharger
    episode_numbers = []
    if episodes_input.lower() == "a":
        # Si l'utilisateur choisit 'A', ajoute tous les épisodes
        episode_numbers = list(range(1, episode_count + 1))
    else:
        # Divise l'entrée par les virgules et supprime les espaces
        parts = episodes_input.split(",")
        for part in parts:
            if "-" in part:
                # Si l'entrée contient un tiret, traite-la comme une plage d'épisodes
                start, end = map(int, part.split("-"))
                episode_numbers.extend(range(start, end + 1))
            else:
                # Si l'entrée est un seul numéro d'épisode, convertit et ajoute
                episode_numbers.append(int(part.strip()))

    driver.get(url)

    # Vérification si la page existe en regardant le titre de la page
    title = driver.title
    exists = title != "Accès Introuvable"

    if not exists:
        print(f"Le lien {url} n'existe pas.")
        driver.quit()
        return False

    # Récupération des informations nécessaires (titre, saison, nombre d'épisodes)
    anime_title = driver.find_element(By.CSS_SELECTOR, "#titreOeuvre").text
    anime_season = driver.find_element(By.CSS_SELECTOR, "#avOeuvre").text
    episode_count = len(
        driver.find_elements(By.CSS_SELECTOR, "#selectEpisodes > option")
    )

    print(f"Titre: {anime_title}")
    print(f"Saison: {anime_season}")
    print(f"Nombre d'épisodes: {episode_count}")

    links = []

    # Boucle sur chaque épisode spécifié par l'utilisateur
    for ep in episode_numbers:
        select_ep = Select(driver.find_element(By.ID, "selectEpisodes"))
        select_ep.select_by_value(str(ep))
        found = False
        reader_options = [
            option.get_attribute("value")
            for option in driver.find_elements(
                By.CSS_SELECTOR, "#selectLecteurs > option"
            )
        ]

        # Boucle sur chaque option de lecteur pour trouver "sibnet"
        for reader in reader_options:
            select_reader = Select(driver.find_element(By.ID, "selectLecteurs"))
            select_reader.select_by_value(reader)
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "playerDF"))
            )

            src = driver.find_element(By.ID, "playerDF").get_attribute("src")
            if "sibnet" in src:
                # Cliquez sur le bouton de lecture
                driver.find_element(
                    By.CSS_SELECTOR, "#video_html5_wrapper > div.vjs-big-play-button"
                ).click()

                # Observer les requêtes réseau
                media_link = None
                while not media_link:
                    for request in driver.requests:
                        if (
                            request.response
                            and request.response.status_code == 206
                            and "media" in request.response.headers["Content-Type"]
                        ):
                            media_link = request.url
                            break

                if media_link:
                    print(f"Lien média trouvé pour l'épisode {ep}: {media_link}")
                    links.append(media_link)
                    found = True
                    break

        if not found:
            print(f"Aucun lecteur 'sibnet' trouvé pour l'épisode {ep}.")

    driver.quit()

    # Écriture des liens dans links.json
    data = []
    if os.path.exists("links.json"):
        with open("links.json", "r") as file:
            data = json.load(file)

    data.extend(links)
    with open("links.json", "w") as file:
        json.dump(data, file, indent=2)

    # Écrire les informations de l'anime dans un fichier temporaire
    temp_data = {
        "animeTitle": anime_title.replace(" ", "_"),
        "animeSeason": anime_season.replace(" ", "_"),
    }
    with open("temp_anime_info.json", "w") as file:
        json.dump(temp_data, file, indent=2)

    return True

# Lance la fonction principale
if __name__ == "__main__":
    success = False

    # Boucle jusqu'à ce que l'utilisateur entre un nom d'animé valide (page existante)
    while not success:
        success = fetch_media_links()
