import datetime, sys
from openpyxl import Workbook
from openpyxl.cell.rich_text import CellRichText, TextBlock
from openpyxl.cell.text import InlineFont
wb = Workbook(); a = wb.active; a.title = "Istruzioni"
a["A1"] = "Foglio che non si legge per primo"
e = wb.create_sheet("Eventi")
e.append(["Titolo", "Data", "Ora inizio", "Prezzo", "Note"])
e.append(["Concerto inventato & amici <prova>", datetime.date(2026, 12, 4), datetime.time(21, 30), 5, "riga uno"])
e["A3"] = CellRichText([TextBlock(InlineFont(b=True), "Testo "), "a pezzi"])
e["C3"] = datetime.time(18, 0)
e["E3"] = "a capo\ndentro la cella"
e["A5"] = "Riga dopo una vuota"; e["E5"] = "Città d’arte · ٢٠٢٦"
e["G5"] = True
wb.save(sys.argv[1]); print("ok")
