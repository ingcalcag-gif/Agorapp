# Genera i file inventati della prova dell'archivio dei registri (voce T-053; prove/archivio-registri.js).
# Servono file veri, salvati con una password dai programmi, per controllare che l'app riconosca la cifratura
# guardando soltanto il contenitore, senza aprirlo. Contengono soltanto testi inventati.
#
# Uso, dalla radice del repository (servono LibreOffice con il suo modulo uno, openpyxl, msoffcrypto-tool e pikepdf):
#   python3 prove/dati/genera-archivio-prova.py prove/dati/archivio
#
# File prodotti:
#   registro-chiaro.xlsx      un registro inventato senza password (da rifiutare)
#   registro-excel.xlsx       lo stesso, cifrato come Excel 2010 e seguenti (cifratura «agile», AES a 256 bit)
#   registro-libreoffice.xlsx lo stesso, salvato con password da LibreOffice Calc
#   registro-vecchio.xls      formato Excel 97 senza password (da rifiutare)
#   registro-vecchio-pw.xls   formato Excel 97 con password (RC4: da rifiutare)
#   registro-pw.ods           formato di LibreOffice con password (da rifiutare: non è Excel)
#   allegato-chiaro.pdf       un allegato inventato senza password (da rifiutare)
#   allegato-aes256.pdf       lo stesso con password, AES a 256 bit
#   allegato-aes128.pdf       lo stesso con password, AES a 128 bit
#   allegato-rc4.pdf          lo stesso con password, RC4 a 128 bit (da rifiutare)
import os, subprocess, sys, tempfile, time

PAROLA = 'prova-archivio-inventata'   # la password dei file di prova: inventata, e scritta qui apposta

def registro_chiaro(dove):
    from openpyxl import Workbook
    wb = Workbook(); a = wb.active; a.title = 'Decisioni'
    a.append(['Registro inventato per la prova'])
    a.append(['Codice', 'Data di registrazione', 'Decisione'])
    a.append(['D-0001', '27/11/2026', 'Decisione inventata per la prova dell\'archivio'])
    wb.save(dove)

def cifra_agile(da, a):
    import msoffcrypto.format.ooxml
    with open(da, 'rb') as f, open(a, 'wb') as g:
        msoffcrypto.format.ooxml.OOXMLFile(f).encrypt(PAROLA, g)

def libreoffice(cartella):
    import uno
    from com.sun.star.beans import PropertyValue
    porta = 2079
    profilo = tempfile.mkdtemp()
    p = subprocess.Popen(['soffice', '--headless', '--invisible', '--norestore', '-env:UserInstallation=file://' + profilo,
                          '--accept=socket,host=127.0.0.1,port=%d;urp;' % porta])
    try:
        ctx = None
        for _ in range(60):
            try:
                locale = uno.getComponentContext()
                res = locale.ServiceManager.createInstanceWithContext('com.sun.star.bridge.UnoUrlResolver', locale)
                ctx = res.resolve('uno:socket,host=127.0.0.1,port=%d;urp;StarOffice.ComponentContext' % porta)
                break
            except Exception:
                time.sleep(0.5)
        if ctx is None: raise SystemExit('LibreOffice non risponde')
        desk = ctx.ServiceManager.createInstanceWithContext('com.sun.star.frame.Desktop', ctx)
        def prop(n, v):
            x = PropertyValue(); x.Name = n; x.Value = v; return x
        doc = desk.loadComponentFromURL('private:factory/scalc', '_blank', 0, (prop('Hidden', True),))
        foglio = doc.Sheets.getByIndex(0)
        foglio.getCellByPosition(0, 0).setString('Registro inventato per la prova')
        foglio.getCellByPosition(0, 1).setString('D-0001')
        foglio.getCellByPosition(1, 1).setString('Decisione inventata per la prova dell\'archivio')
        def salva(nome, filtro, parola):
            url = uno.systemPathToFileUrl(os.path.abspath(os.path.join(cartella, nome)))
            opz = [prop('FilterName', filtro), prop('Overwrite', True)]
            if parola: opz.append(prop('Password', parola))
            doc.storeToURL(url, tuple(opz))
        salva('registro-libreoffice.xlsx', 'Calc Office Open XML', PAROLA)
        salva('registro-vecchio.xls', 'MS Excel 97', None)
        salva('registro-vecchio-pw.xls', 'MS Excel 97', PAROLA)
        salva('registro-pw.ods', 'calc8', PAROLA)
        doc.close(True)
        try: desk.terminate()
        except Exception: pass
    finally:
        time.sleep(1); p.kill()

def allegati(cartella):
    import pikepdf
    def nuovo():
        pdf = pikepdf.new()
        testo = b'BT /F1 14 Tf 72 720 Td (Allegato inventato per la prova dell\'archivio) Tj ET'
        font = pikepdf.Dictionary(Type=pikepdf.Name.Font, Subtype=pikepdf.Name.Type1, BaseFont=pikepdf.Name.Helvetica)
        pagina = pikepdf.Dictionary(Type=pikepdf.Name.Page, MediaBox=[0, 0, 595, 842],
                                    Resources=pikepdf.Dictionary(Font=pikepdf.Dictionary(F1=font)),
                                    Contents=pdf.make_stream(testo))
        pdf.pages.append(pikepdf.Page(pagina))
        return pdf
    nuovo().save(os.path.join(cartella, 'allegato-chiaro.pdf'))
    for nome, cif in [('allegato-aes256.pdf', pikepdf.Encryption(user=PAROLA, owner=PAROLA, R=6, aes=True)),
                      ('allegato-aes128.pdf', pikepdf.Encryption(user=PAROLA, owner=PAROLA, R=4, aes=True)),
                      ('allegato-rc4.pdf', pikepdf.Encryption(user=PAROLA, owner=PAROLA, R=3, aes=False, metadata=False))]:
        # il PDF a 256 bit con la tabella dei riferimenti come oggetto (come i PDF più nuovi), gli altri con la tabella classica
        modo = pikepdf.ObjectStreamMode.generate if nome == 'allegato-aes256.pdf' else pikepdf.ObjectStreamMode.disable
        nuovo().save(os.path.join(cartella, nome), encryption=cif, object_stream_mode=modo)

def main():
    cartella = sys.argv[1] if len(sys.argv) > 1 else 'prove/dati/archivio'
    os.makedirs(cartella, exist_ok=True)
    chiaro = os.path.join(cartella, 'registro-chiaro.xlsx')
    registro_chiaro(chiaro)
    cifra_agile(chiaro, os.path.join(cartella, 'registro-excel.xlsx'))
    libreoffice(cartella)
    allegati(cartella)
    print('ok')

main()
