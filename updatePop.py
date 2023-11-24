import csv
import json
from pathlib import Path

CSV = Path("update-pop.csv")
SCORE_CARDS_FP = Path("data/score-cards.json")

def main() -> None:
    with CSV.open(newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    score_cards = json.loads(SCORE_CARDS_FP.read_text())
    for city_id, score_card in score_cards.items():
        row = next((row for row in rows if row["City"] == city_id), None)
        if row is None:
            continue
        score_card["Parking Score"] = row["PS"]
        score_card["Metro Population"] = row["Pop"]
        score_card["cityType"] = row["City Type"].lower()
    SCORE_CARDS_FP.write_text(json.dumps(score_cards))


main()