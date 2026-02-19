import os
from dotenv import load_dotenv

load_dotenv()

# stores to be excluded from results
BLACKLIST = {
    "lidl",
    "aldi",
    "mcdonald's",
    "starbucks",
    "subway",
    "kfc",
    "burger king",
    "ikea",
    "h&m",
    "zara",
    "mediamarkt",
    "saturn",
    "dm",
    "rossmann",
    "edeka",
    "rewe",
    "netto",
    "decathlon",
    "kaufland",
    "penny",
    "norma",
    "obi",
    "bauhaus",
    "toom",
}

BLACKLIST = {} # Currently disabled

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
