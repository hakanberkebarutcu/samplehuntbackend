import re

COUNTRIES = [
    "Afghanistan", "Albania", "Algeria", "Angola", "Antigua & Barbuda", "Argentina", "Armenia",
    "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados",
    "Belgium", "Benin", "Bermuda", "Bolivia", "Bosnia & Herzegovina", "Botswana", "Brazil",
    "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde",
    "Central African Republic", "Chad", "Chile", "China", "Colombia", "Congo", "Costa Rica",
    "Croatia", "Cuba", "Cyprus", "Czech Republic", "Czechoslovakia", "Denmark", "Dominican Republic",
    "Ecuador", "Egypt", "El Salvador", "Eritrea", "Estonia", "Ethiopia", "Fiji", "Finland",
    "France", "French Guiana", "French Polynesia", "Gabon", "Gambia", "Georgia", "Germany",
    "Ghana", "Gibraltar", "Greece", "Guadeloupe", "Guatemala", "Guinea", "Guyana", "Haiti",
    "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
    "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan",
    "Kenya", "Korea", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia",
    "Libya", "Lithuania", "Luxembourg", "Macao", "Madagascar", "Malawi", "Malaysia", "Mali",
    "Malta", "Martinique", "Mauritania", "Mauritius", "Mexico", "Moldova", "Mongolia", "Montenegro",
    "Morocco", "Mozambique", "Myanmar", "Namibia", "Nepal", "Netherlands", "Netherlands Antilles",
    "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Norway", "Oman", "Pakistan",
    "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland",
    "Portugal", "Puerto Rico", "Qatar", "Reunion", "Romania", "Russia", "Rwanda", "Saudi Arabia",
    "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
    "Somalia", "South Africa", "Soviet Union", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden",
    "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Trinidad & Tobago",
    "Tunisia", "Turkey", "Turkmenistan", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
    "United States", "Uruguay", "Uzbekistan", "Venezuela", "Vietnam", "Yugoslavia", "Zambia", "Zimbabwe"
]

MUSIC_GENRES = [
    "Brass & Military", "Children's", "Classical", "Electronic", "Folk, World, & Country",
    "Funk / Soul", "Hip Hop", "Jazz", "Latin", "Non-Music", "Pop", "Reggae", "Rock", "Stage & Screen"
]

# ─────────────────────────────────────────────────────────────────────────────
# GENRE_KEYWORDS — her tür için anahtar kelime listesi (öncelik sırasına göre)
# Bir başlık birden fazla türe giriyorsa ilk eşleşen kazanır.
# ─────────────────────────────────────────────────────────────────────────────
GENRE_KEYWORDS = {
    "Hip Hop": [
        "hip hop", "hiphop", "rap", "boom bap", "boombap", "hip-hop",
        "lo-fi hip", "lofi hip", "golden era", "golden age rap",
        "underground rap", "conscious rap", "freestyle", "mc ", " mc",
        "breakdance", "b-boy",
    ],
    "Electronic": [
        "electronic", "electronica", "synth", "synthesizer", "techno",
        "house music", "trance", "ambient", "kosmische", "krautrock",
        "italo disco", "new wave", "synth pop", "synthpop", "electro",
        "industrial", "rave", "edm", "drum machine", "sequencer",
        "modular", "eurorack",
    ],
    "Jazz": [
        "jazz", "bebop", "bop", "modal jazz", "free jazz", "fusion jazz",
        "hard bop", "cool jazz", "swing", "big band", "quartet",
        "quintet", "trio jazz", "post bop", "soul jazz", "latin jazz",
        "jazz funk", "jazz rock", "jazz blues", "dixieland",
    ],
    "Funk / Soul": [
        "funk", "soul", "groove", "r&b", "rnb", "rhythm and blues",
        "rhythm & blues", "northern soul", "deep soul", "southern soul",
        "motown", "stax", "atlantic soul", "gospel soul", "neo soul",
        "philly soul", "memphis soul",
    ],
    "Reggae": [
        "reggae", "dub", "ska", "rocksteady", "dancehall", "roots reggae",
        "conscious reggae", "dub plate", "sound system", "toasting",
        "ragga", "lovers rock",
    ],
    "Latin": [
        "latin", "cumbia", "salsa", "bossa nova", "bossanova", "samba",
        "merengue", "mambo", "cha cha", "tango", "latin jazz",
        "latin boogaloo", "latin soul", "latin funk", "latin rock",
        "trova", "son cubano", "bolero", "norteno", "norteño",
        "ranchera", "mariachi", "vallenato",
    ],
    "Rock": [
        "rock", "psychedelic", "progressive rock", "prog rock",
        "garage rock", "hard rock", "punk", "post punk", "new wave rock",
        "grunge", "alternative rock", "indie rock", "psych rock",
        "proto punk", "glam rock", "art rock",
    ],
    "Folk, World, & Country": [
        "folk", "country", "bluegrass", "acoustic", "world music",
        "afrobeat", "highlife", "afro", "ethiopian", "turkish psych",
        "arabesk", "anadolu", "celtic", "folk revival", "singer songwriter",
        "protest song", "appalachian",
    ],
    "Classical": [
        "classical", "orchestra", "orchestral", "symphony", "concerto",
        "chamber music", "string quartet", "opera", "baroque",
        "romantic era", "neoclassical", "avant garde classical",
        "minimalist classical", "modern classical",
    ],
    "Stage & Screen": [
        "soundtrack", "film score", "library music", "library film",
        "cinema", "movie score", "television score", "tv theme",
        "production music", "background music film", "exploitation music",
        "giallo", "spaghetti western",
    ],
}

# Arama keyword'ünden tür tahmini için ek eşleme
# (search_keywords içindeki bazı ifadeler başlıkta geçmez)
SEARCH_KEYWORD_TO_GENRE = {
    "hip hop": "Hip Hop",
    "rap": "Hip Hop",
    "boom bap": "Hip Hop",
    "jazz": "Jazz",
    "bop": "Jazz",
    "swing": "Jazz",
    "funk": "Funk / Soul",
    "soul": "Funk / Soul",
    "groove": "Funk / Soul",
    "r&b": "Funk / Soul",
    "electronic": "Electronic",
    "synth": "Electronic",
    "techno": "Electronic",
    "house": "Electronic",
    "ambient": "Electronic",
    "kosmische": "Electronic",
    "italo disco": "Electronic",
    "reggae": "Reggae",
    "dub": "Reggae",
    "ska": "Reggae",
    "latin": "Latin",
    "cumbia": "Latin",
    "salsa": "Latin",
    "bossa": "Latin",
    "samba": "Latin",
    "rock": "Rock",
    "psychedelic": "Rock",
    "punk": "Rock",
    "prog": "Rock",
    "folk": "Folk, World, & Country",
    "country": "Folk, World, & Country",
    "blues": "Folk, World, & Country",
    "afrobeat": "Folk, World, & Country",
    "highlife": "Folk, World, & Country",
    "afro": "Folk, World, & Country",
    "world": "Folk, World, & Country",
    "turkish": "Folk, World, & Country",
    "arabesk": "Folk, World, & Country",
    "classical": "Classical",
    "orchestra": "Classical",
    "soundtrack": "Stage & Screen",
    "film score": "Stage & Screen",
    "library music": "Stage & Screen",
    "library": "Stage & Screen",
}

REGION_KEYWORDS = {
    "Afghanistan": ["afghan", "afghani"],
    "Albania": ["albania", "albanian"],
    "Algeria": ["algeria", "algerian"],
    "Angola": ["angola", "angolan"],
    "Argentina": ["argentina", "argentine", "tango"],
    "Armenia": ["armenia", "armenian"],
    "Australia": ["australia", "australian", "aussie"],
    "Austria": ["austria", "austrian", "vienna"],
    "Azerbaijan": ["azerbaijan", "azerbaijani", "baku"],
    "Bahamas": ["bahamas", "bahamian"],
    "Bangladesh": ["bangladesh", "bangladeshi", "bengali"],
    "Barbados": ["barbados", "barbadian"],
    "Belgium": ["belgium", "belgian"],
    "Benin": ["benin", "beninese"],
    "Bolivia": ["bolivia", "bolivian"],
    "Bosnia": ["bosnia", "bosnian"],
    "Brazil": ["brazil", "brazilian", "brasil", "baile", "samba", "bossa"],
    "Bulgaria": ["bulgaria", "bulgarian"],
    "Cambodia": ["cambodia", "cambodian", "khmer"],
    "Cameroon": ["cameroon", "cameroonian"],
    "Canada": ["canada", "canadian"],
    "Chile": ["chile", "chilen"],
    "China": ["china", "chinese", "cantonese"],
    "Colombia": ["colombia", "colombian"],
    "Costa Rica": ["costa rica", "tico"],
    "Croatia": ["croatia", "croatian"],
    "Cuba": ["cuba", "cuban", "son", "salsa"],
    "Cyprus": ["cyprus", "cypriot"],
    "Czech Republic": ["czech", "czechia", "prague"],
    "Czechoslovakia": ["czechoslovakia", "czech", "slovak"],
    "Denmark": ["denmark", "danish"],
    "Dominican Republic": ["dominican", "salsa"],
    "Ecuador": ["ecuador", "ecuadorian"],
    "Egypt": ["egypt", "egyptian", "cairo"],
    "El Salvador": ["el salvador", "salvadoran"],
    "Estonia": ["estonia", "estonian"],
    "Ethiopia": ["ethiopia", "ethiopian", "ethio", "eritre"],
    "Fiji": ["fiji", "fijian"],
    "Finland": ["finland", "finnish"],
    "France": ["france", "french", "paris", "chanson", "ye-ye", "yeyey"],
    "Gabon": ["gabon", "gabonese"],
    "Gambia": ["gambia", "gambian"],
    "Georgia": ["georgia", "georgian"],
    "Germany": ["germany", "german", "deutsch", "kraut"],
    "Ghana": ["ghana", "ghanaian", "highlife"],
    "Greece": ["greece", "greek", "rebetiko"],
    "Guadeloupe": ["guadeloupe", "guadeloupean"],
    "Guatemala": ["guatemala", "guatemalan"],
    "Guinea": ["guinea", "guinean"],
    "Guyana": ["guyana", "guyanese"],
    "Haiti": ["haiti", "haitian", "compas"],
    "Honduras": ["honduras", "honduran"],
    "Hong Kong": ["hong kong", "hongkong", "cantonese"],
    "Hungary": ["hungary", "hungarian", "magyar"],
    "Iceland": ["iceland", "icelandic"],
    "India": ["india", "indian", "hindi", "bollywood", "carnatic", "sitar"],
    "Indonesia": ["indonesia", "indonesian", "javanese", "bali"],
    "Iran": ["iran", "iranian", "persian", "farsi"],
    "Iraq": ["iraq", "iraqi"],
    "Ireland": ["ireland", "irish"],
    "Israel": ["israel", "israeli", "jewish", "klezmer"],
    "Italy": ["italy", "italian", "napoli", "taranta"],
    "Ivory Coast": ["ivory coast", "cote d'ivoire", "ivorian"],
    "Jamaica": ["jamaica", "jamaican", "reggae", "ska", "rocksteady", "dub", "dancehall"],
    "Japan": ["japan", "japanese", "j-pop", "city pop", "shibuya", "karaoke"],
    "Jordan": ["jordan", "jordanian"],
    "Kazakhstan": ["kazakhstan", "kazakh"],
    "Kenya": ["kenya", "kenyan", "benga"],
    "Korea": ["korea", "korean", "k-pop"],
    "Kuwait": ["kuwait", "kuwaiti"],
    "Laos": ["laos", "laotian"],
    "Latvia": ["latvia", "latvian"],
    "Lebanon": ["lebanon", "lebanese"],
    "Liberia": ["liberia", "liberian"],
    "Libya": ["libya", "libyan"],
    "Lithuania": ["lithuania", "lithuanian"],
    "Luxembourg": ["luxembourg", "luxembourgish"],
    "Macao": ["macao", "macau", "macanese"],
    "Madagascar": ["madagascar", "malagasy"],
    "Malawi": ["malawi", "malawian"],
    "Malaysia": ["malaysia", "malaysian", "malay"],
    "Mali": ["mali", "malian", "djembe", "balafon"],
    "Malta": ["malta", "maltese"],
    "Martinique": ["martinique", "martinican"],
    "Mauritania": ["mauritania", "mauritanian"],
    "Mauritius": ["mauritius", "mauritian"],
    "Mexico": ["mexico", "mexican", "ranchera", "norteño", "mariachi"],
    "Moldova": ["moldova", "moldovan"],
    "Mongolia": ["mongolia", "mongolian"],
    "Montenegro": ["montenegro", "montenegrin"],
    "Morocco": ["morocco", "moroccan", "raï"],
    "Mozambique": ["mozambique", "mozambican"],
    "Myanmar": ["myanmar", "burmese"],
    "Namibia": ["namibia", "namibian"],
    "Nepal": ["nepal", "nepalese", "nepali"],
    "Netherlands": ["netherlands", "dutch", "holland", "amsterdam"],
    "New Zealand": ["new zealand", "kiwi"],
    "Nicaragua": ["nicaragua", "nicaraguan"],
    "Niger": ["niger", "nigerien"],
    "Nigeria": ["nigeria", "nigerian", "afrobeat", "highlife", "fuji"],
    "Norway": ["norway", "norwegian"],
    "Oman": ["oman", "omani"],
    "Pakistan": ["pakistan", "pakistani", "qawwali"],
    "Palestine": ["palestine", "palestinian"],
    "Panama": ["panama", "panamanian"],
    "Paraguay": ["paraguay", "paraguayan"],
    "Peru": ["peru", "peruvian", "andina", "cumbia"],
    "Philippines": ["philippines", "filipino", "pinoy"],
    "Poland": ["poland", "polish"],
    "Portugal": ["portugal", "portuguese", "fado"],
    "Puerto Rico": ["puerto rico", "puertorican", "reggaeton"],
    "Qatar": ["qatar", "qatari"],
    "Romania": ["romania", "romanian"],
    "Russia": ["russia", "russian", "soviet"],
    "Rwanda": ["rwanda", "rwandan"],
    "Saudi Arabia": ["saudi", "saudi arabia"],
    "Senegal": ["senegal", "senegalese", "mbalax"],
    "Serbia": ["serbia", "serbian"],
    "Sierra Leone": ["sierra leone"],
    "Singapore": ["singapore", "singaporean"],
    "Slovakia": ["slovakia", "slovak"],
    "Slovenia": ["slovenia", "slovenian"],
    "Somalia": ["somalia", "somali"],
    "South Africa": ["south africa", "afrikaans", "township", "marabi"],
    "Soviet Union": ["soviet", "ussr"],
    "Spain": ["spain", "spanish", "flamenco", "sevillanas"],
    "Sri Lanka": ["sri lanka", "sri lankan", "sinhala"],
    "Sudan": ["sudan", "sudanese"],
    "Suriname": ["suriname", "surinamese"],
    "Sweden": ["sweden", "swedish"],
    "Switzerland": ["switzerland", "swiss"],
    "Syria": ["syria", "syrian"],
    "Taiwan": ["taiwan", "taiwanese", "hokkien"],
    "Tajikistan": ["tajikistan", "tajik"],
    "Tanzania": ["tanzania", "tanzanian", "bongo"],
    "Thailand": ["thailand", "thai", "luk thung"],
    "Togo": ["togo", "togolese"],
    "Trinidad & Tobago": ["trinidad", "tobago", "calypso", "soca"],
    "Tunisia": ["tunisia", "tunisian"],
    "Turkey": ["turkey", "turkish", "türk", "arabesk", "anadolu", "psych"],
    "Uganda": ["uganda", "ugandan"],
    "Ukraine": ["ukraine", "ukrainian"],
    "United Arab Emirates": ["uae", "emirati", "dubai"],
    "United Kingdom": ["uk", "britain", "british", "england", "scotland", "wales", "northern soul"],
    "United States": ["usa", "united states", "american", "nyc", "los angeles", "chicago", "detroit", "memphis", "nashville"],
    "Uruguay": ["uruguay", "uruguayan"],
    "Uzbekistan": ["uzbekistan", "uzbek"],
    "Venezuela": ["venezuela", "venezuelan"],
    "Vietnam": ["vietnam", "vietnamese"],
    "Yugoslavia": ["yugoslavia", "yugo"],
    "Zambia": ["zambia", "zambian"],
    "Zimbabwe": ["zimbabwe", "zimbabwean"]
}

# ─────────────────────────────────────────────────────────────────────────────
# AI kanal tespiti için anahtar kelimeler
# ─────────────────────────────────────────────────────────────────────────────
AI_CHANNEL_KEYWORDS = [
    "ai music", "ai generated", "ai songs", "ai artist", "ai records",
    "suno", "udio", "loudme", "artificial music", "neural music",
    "generated music", "ai covers", "ai band", "ai singer",
    "musicgen", "stable audio", "audiogen", "ai producer",
    "robot music", "synthetic music", "deepfake music",
]

class MusicAnalyzer:
    def __init__(self):
        self.music_genres = [g.lower() for g in MUSIC_GENRES]

    def is_ai_channel(self, channel_name: str) -> bool:
        """Kanal adı AI içerik üreticisine ait mi?"""
        channel_lower = channel_name.lower()
        for kw in AI_CHANNEL_KEYWORDS:
            if kw in channel_lower:
                return True
        return False

    def detect_country(self, title, channel_name=""):
        text = f"{title} {channel_name}".lower()
        for country, keywords in REGION_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text:
                    return country
        return "United States"

    def detect_genre(self, title, channel_name="", search_keyword=""):
        """
        Tür tespiti — 3 katmanlı:
        1. Başlık + kanal adındaki anahtar kelimeler (en güvenilir)
        2. Arama keyword'ünden tahmin (başlıkta ipucu yoksa)
        3. Hiçbiri eşleşmezse "unknown"
        """
        text = f"{title} {channel_name}".lower()

        # Katman 1: Başlık/kanal üzerinden doğrudan tespiti
        for genre, keywords in GENRE_KEYWORDS.items():
            for kw in keywords:
                if kw in text:
                    return genre

        # Katman 2: Arama keyword'ünden çıkarım
        if search_keyword:
            kw_lower = search_keyword.lower()
            for trigger, genre in SEARCH_KEYWORD_TO_GENRE.items():
                if trigger in kw_lower:
                    return genre

        return "unknown"

    def extract_year(self, title):
        years = re.findall(r'\b(19[5-9]\d|20[0-2]\d)\b', title)
        if years:
            return int(years[0])
        return None
