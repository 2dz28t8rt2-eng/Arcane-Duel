using System.IO.Compression;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace ArcaneCardEditor;

internal sealed partial class Editor
{
    private sealed class CardDraft
    {
        public string SlotId { get; set; } = Guid.NewGuid().ToString("N");
        public JsonObject Card { get; set; } = new();
        public byte[]? Image { get; set; }
        public string? ImageExtension { get; set; }
        public byte[]? Frame { get; set; }
        public string? FrameExtension { get; set; }
        public override string ToString() =>
            "#" + (Card["id"]?.ToString() ?? "?") + " · LV " + (Card["level"]?.ToString() ?? "?")
            + " · " + (Card["name"]?.ToString() ?? "Unbenannt");
    }
    readonly List<CardDraft> shelf = new();
    static string ShelfFile => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "ArcaneDuel", "CardEditor", "Kartenablage.json");

    void RestoreShelf()
    {
        try
        {
            if(!File.Exists(ShelfFile))return;
            var entries=JsonSerializer.Deserialize<List<CardDraft>>(File.ReadAllText(ShelfFile,Encoding.UTF8));
            if(entries!=null)shelf.AddRange(entries.Where(x=>x.Card!=null));
        }
        catch(Exception ex){status.Text="Ablage konnte nicht geladen werden: "+ex.Message;}
    }
    void PersistShelf()
    {
        Directory.CreateDirectory(Path.GetDirectoryName(ShelfFile)!);
        var tmp=ShelfFile+".tmp";
        File.WriteAllText(tmp,JsonSerializer.Serialize(shelf,Pretty),new UTF8Encoding(false));
        File.Move(tmp,ShelfFile,true);
    }
    CardDraft Snapshot() => new()
    {
        Card=(JsonObject)BuildCard().DeepClone(),
        Image=imageBytes?.ToArray(), ImageExtension=imageExtension,
        Frame=customFrameBytes?.ToArray(), FrameExtension=customFrameExtension
    };
    void AddToShelf()
    {
        try
        {
            var draft=Snapshot();
            var id=draft.Card["id"]?.ToString();
            var prior=shelf.FindIndex(x=>x.Card["id"]?.ToString()==id);
            if(prior>=0)
            {
                if(MessageBox.Show(this,"Karten-ID "+id+" existiert bereits in der Ablage. Ersetzen?",
                   "Karte aktualisieren",MessageBoxButtons.YesNo,MessageBoxIcon.Question)!=DialogResult.Yes)return;
                draft.SlotId=shelf[prior].SlotId;shelf[prior]=draft;
            }
            else shelf.Add(draft);
            PersistShelf();
            status.Text="Karte gespeichert · "+shelf.Count+" Karte(n) in der Ablage.";
        }
        catch(Exception ex){Error(ex);}
    }
    void ApplyDraft(CardDraft draft)
    {
        ApplyCard(draft.Card,AppContext.BaseDirectory);
        imageBytes=draft.Image?.ToArray();imageExtension=draft.ImageExtension;
        if(imageBytes!=null)
        {
            preview.SetImage(imageBytes);
            artLabel.Text="Artwork aus Ablage · "+(draft.Card["art"]?.ToString()??"");
        }
        customFrameBytes=draft.Frame?.ToArray();customFrameExtension=draft.FrameExtension;
        if(customFrameBytes!=null)
        {
            preview.SetCustomFrame(customFrameBytes,customFrameExtension);
            if(!frames.Items.Cast<Choice>().Any(x=>x.Id=="custom"))
                frames.Items.Add(new Choice("custom","Eigener Rahmen aus Ablage"));
            SetChoice(frames,"custom");
        }
        RefreshPreview();status.Text="Karte aus Ablage geladen.";
    }
    void OpenShelf()
    {
        using var win=new Form {Text="Arcane Duel · Kartenablage",Width=850,Height=560,
            MinimumSize=new Size(650,400),StartPosition=FormStartPosition.CenterParent,
            BackColor=Color.FromArgb(29,25,39),ForeColor=Color.FromArgb(238,229,207),
            Font=new Font("Segoe UI",10)};
        var items=new ListBox {Dock=DockStyle.Fill,IntegralHeight=false,
            BackColor=Color.FromArgb(40,34,51),ForeColor=Color.White};
        var hint=new Label {Dock=DockStyle.Top,Height=50,
            Text="Fertige Karten bleiben dauerhaft in der Ablage.\nDoppelklick: Karte zur Bearbeitung öffnen.",
            Padding=new Padding(8,7,0,0)};
        var bar=new FlowLayoutPanel {Dock=DockStyle.Bottom,Height=56,AutoScroll=true,WrapContents=false};
        void redraw(string? slot=null)
        {
            items.BeginUpdate();items.Items.Clear();
            foreach(var d in shelf)items.Items.Add(d);
            items.EndUpdate();
            var index=slot==null?-1:shelf.FindIndex(x=>x.SlotId==slot);
            if(index>=0)items.SelectedIndex=index;
            else if(items.Items.Count>0)items.SelectedIndex=0;
        }
        void load()
        {
            if(items.SelectedItem is not CardDraft d)return;
            ApplyDraft(d);win.DialogResult=DialogResult.OK;win.Close();
        }
        AddButton(bar,"Bearbeiten",(_,_)=>load(),true);
        AddButton(bar,"Duplizieren",(_,_)=>{
            if(items.SelectedItem is not CardDraft d)return;
            var copy=new CardDraft {Card=(JsonObject)d.Card.DeepClone(),Image=d.Image?.ToArray(),
                ImageExtension=d.ImageExtension,Frame=d.Frame?.ToArray(),FrameExtension=d.FrameExtension};
            copy.Card["name"]=(copy.Card["name"]?.ToString()??"Karte")+" (Kopie)";
            copy.Card["id"]=-1; // new unique game ID required before batch export
            shelf.Add(copy);PersistShelf();redraw(copy.SlotId);
        });
        AddButton(bar,"Entfernen",(_,_)=>{
            if(items.SelectedItem is not CardDraft d)return;
            if(MessageBox.Show(win,"Karte wirklich aus der Ablage löschen?","Ablage",
               MessageBoxButtons.YesNo,MessageBoxIcon.Question)!=DialogResult.Yes)return;
            shelf.Remove(d);PersistShelf();redraw();
        });
        AddButton(bar,"Alle exportieren (ZIP)",(_,_)=>ExportShelf(),true);
        items.DoubleClick+=(_,_)=>load();
        win.Controls.Add(items);win.Controls.Add(hint);win.Controls.Add(bar);
        redraw();win.ShowDialog(this);
    }
    private static void ZipText(ZipArchive zip,string name,string content)
    {
        using var writer=new StreamWriter(zip.CreateEntry(name,CompressionLevel.Optimal).Open(),new UTF8Encoding(false));
        writer.Write(content);
    }
    private static void ZipBytes(ZipArchive zip,string name,byte[] bytes)
    {
        using var writer=zip.CreateEntry(name,CompressionLevel.Optimal).Open();
        writer.Write(bytes);
    }
    private static string SafeName(string value)
    {
        var name=new string(value.Where(c=>char.IsAsciiLetterOrDigit(c)||c is '-' or '_').Take(45).ToArray());
        return name.Length==0?"karte":name;
    }
    private static string RelativeAsset(JsonObject card,string field)
    {
        var name=card[field]?.ToString()?.Replace('\\','/')??"";
        return name.StartsWith("assets/",StringComparison.Ordinal)
            && !name.Split('/').Any(x=>x is "." or "..")
            && !Path.IsPathRooted(name) ? name : "";
    }
    static void WriteShelfPackage(string path,IReadOnlyList<CardDraft> drafts)
    {
        if(drafts.Count==0)throw new InvalidOperationException("Die Ablage ist leer.");
        var ids=new HashSet<int>();
        foreach(var d in drafts)
        {
            if(!int.TryParse(d.Card["id"]?.ToString(),out var id)||id<0)
                throw new InvalidOperationException("Eine Karte benötigt noch eine gültige ID. Bitte bearbeiten.");
            if(!ids.Add(id))throw new InvalidOperationException("Doppelte ID "+id+" in der Ablage.");
        }
        using var file=new FileStream(path,FileMode.Create,FileAccess.Write,FileShare.None);
        using var archive=new ZipArchive(file,ZipArchiveMode.Create);
        var entries=new JsonArray();
        foreach(var d in drafts.OrderBy(x=>int.Parse(x.Card["id"]!.ToString())))
        {
            var card=d.Card;var id=int.Parse(card["id"]!.ToString());
            var folder="cards/"+id.ToString("D6")+"-"+SafeName(card["name"]?.ToString()??"karte")+"/";
            ZipText(archive,folder+"card.json",card.ToJsonString(Pretty));
            var art=RelativeAsset(card,"art");
            if(d.Image!=null)
            {
                if(art.Length==0)throw new InvalidOperationException("Ungültiger Bildpfad auf Karte "+id);
                ZipBytes(archive,folder+art,d.Image);
            }
            var frame=RelativeAsset(card,"customFrame");
            if(d.Frame!=null)
            {
                if(frame.Length==0)throw new InvalidOperationException("Ungültiger Rahmenpfad auf Karte "+id);
                ZipBytes(archive,folder+frame,d.Frame);
            }
            entries.Add(new JsonObject {["id"]=id,["name"]=card["name"]?.ToString()??"",
                ["folder"]=folder,["cardJson"]=folder+"card.json",["artwork"]=art,
                ["artworkBundled"]=d.Image!=null,["frameBundled"]=d.Frame!=null});
        }
        ZipText(archive,"manifest.json",new JsonObject {
            ["format"]="arcane-duel-card-batch-v1",
            ["exportedAtUtc"]=DateTimeOffset.UtcNow.ToString("O"),
            ["cardCount"]=drafts.Count,["cards"]=entries
        }.ToJsonString(Pretty));
        ZipText(archive,"CHATGPT_IMPORT.md","""
# Arcane Duel – Importanweisung für ChatGPT

Jede Karte ist einzeln im Archiv unter cards/<ID>-<Name>/card.json.
manifest.json verzeichnet sämtliche IDs, Kartendaten und Dateiordner.

1. GitHub-Repository: 2dz28t8rt2-eng/Arcane-Duel.
   Arbeite auf einem neuen Feature-Branch von development, ändere main nicht.
2. Lade manifest.json und jede referenzierte card.json.
3. Prüfe Karten-IDs vor dem Einspielen. Aktualisiere vorhandene Einträge gezielt,
   füge neue ohne Kollision hinzu und bewahre unbekannte JSON-Felder.
4. Originale Artwork-Pfade bleiben erhalten; bei neuen Bildern oder eigenen
   Rahmen kopiere die mitgelieferten Assets aus dem jeweiligen Kartenordner
   in die in card.json hinterlegten relativen assets/-Pfade.
5. Prüfe die kanonische Solo-Kartenquelle, die Generierung der Solo-/Duo-Kataloge
   und die Online-2v2-Kartendaten. Synchronisiere Rollen, Tags, Level, Werte,
   Fusionen, Decks, Loot und Freischaltungen konsistent.
6. Fähigkeitstext allein implementiert keine Gameplay-Fähigkeit! Neue Fähigkeiten
   nur mit ausdrücklich erstellter und getesteter Spielelogik übernehmen.
7. Vor Abschluss Solo-, Duo-, Karten- und Regressions-Tests ausführen.
   Keine bestehenden Spielerprofile oder Spielstände überschreiben.
8. Relevante Backend-/Supabase-Deployments erst nach Prüfung des tatsächlich
   angebundenen Projekts und einer gesonderten Integrationsfreigabe.
9. Änderungen zur Prüfung als Pull Request gegen development bereitstellen.

Die ZIP-Datei ist ein Übergabeentwurf und aktualisiert nicht das Live-Spiel.
""");
    }
    void ExportShelf()
    {
        try
        {
            if(shelf.Count==0)throw new InvalidOperationException("Bitte zuerst eine Karte zur Ablage hinzufügen.");
            using var dialog=new SaveFileDialog {Filter="ZIP-Datei (*.zip)|*.zip",
                FileName="Arcane-Duel-Karten-"+DateTime.Now.ToString("yyyyMMdd-HHmm")+".zip"};
            if(dialog.ShowDialog(this)!=DialogResult.OK)return;
            WriteShelfPackage(dialog.FileName,shelf);
            status.Text=shelf.Count+" Karten mit Importanweisung exportiert.";
            using var popup=new SharePathDialog(dialog.FileName);popup.ShowDialog(this);
        }catch(Exception ex){Error(ex);}
    }
    void SetupInputAssist(FlowLayoutPanel stack)
    {
        var presets=new Dictionary<string,string[]>
        {
            ["element"]=new[]{"FEUER","WASSER","ERDE","WIND","LICHT","DUNKEL"},
            ["role"]=new[]{"combatant","guardian","predator","soul","resonator","weaver","support","defender","allrounder"},
            ["rarity"]=new[]{"common","uncommon","rare","epic","legendary"},
            ["kind"]=new[]{"spirit","beast","undead","construct","elemental","dragon","humanoid"},
            ["roleStyle"]=new[]{"offense","defense","balanced","support"},
            ["essenceSchool"]=new[]{"fusion","guardian","soul"}
        };
        var tooltips=new ToolTip{AutoPopDelay=15000,InitialDelay=350,ReshowDelay=150};
        foreach(var item in fields)
        {
            var key=item.Key;var box=item.Value;
            tooltips.SetToolTip(box,key switch {
                "id"=>"Eindeutige Karten-ID. Bestehende IDs werden beim Spielimport aktualisiert.",
                "atk" or "def" or "pveAtk" or "pveDef"=>"Ganze nichtnegative Werte; Spielbalance separat prüfen.",
                "level"=>"Monsterlevel. Regulär sind Stufen 1–10 vorgesehen.",
                "role"=>"Rollenkennung aus dem Spiel; neue Rollen brauchen eigene Spiellogik.",
                "ability"=>"Anzeigetext. Erzeugt allein keine spielbare Fähigkeit.",
                "tags"=>"Kommagetrennte Schlagwörter, z. B. beast, boss.",
                _=>"Frei bearbeitbares Feld mit Vorschlägen aus dem vorhandenen Katalog."
            });
            if(!presets.TryGetValue(key,out var values))continue;
            var choices=values.Concat(AssetCatalog.Cards.Select(c=>c[key]?.ToString()??""))
                .Where(x=>!string.IsNullOrWhiteSpace(x)).Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(x=>x).ToArray();
            var auto=new AutoCompleteStringCollection();auto.AddRange(choices);
            box.AutoCompleteSource=AutoCompleteSource.CustomSource;
            box.AutoCompleteMode=AutoCompleteMode.SuggestAppend;
            box.AutoCompleteCustomSource=auto;
            if(key is not ("element" or "role" or "rarity" or "kind"))continue;
            var row=new FlowLayoutPanel {Width=530,AutoSize=true,WrapContents=true,
                Margin=new Padding(0,1,0,7)};
            foreach(var value in values.Take(key=="role"?8:6))
            {
                var selected=value;
                var chip=new Button {Text=value,AutoSize=true,Height=27,FlatStyle=FlatStyle.Flat,
                    BackColor=Color.FromArgb(62,54,75),ForeColor=Color.FromArgb(238,224,193),
                    Margin=new Padding(2,1,3,1),Font=new Font("Segoe UI",8)};
                chip.Click+=(_,_)=>box.Text=selected;
                row.Controls.Add(chip);
            }
            stack.Controls.Add(row);
            stack.Controls.SetChildIndex(row,stack.Controls.GetChildIndex(box)+1);
        }
        var helper=new FlowLayoutPanel {Width=530,Height=42,WrapContents=false};
        AddButton(helper,"JSON-Beispiel",(_,_)=>
            extra.Text="{\n  \"source\": \"editor\",\n  \"fusionReference\": null,\n  \"lv1Special\": null\n}");
        AddButton(helper,"JSON prüfen",(_,_)=>
        {
            try
            {
                if(JsonNode.Parse(extra.Text) is not JsonObject)
                    throw new JsonException("Erwartet: ein JSON-Objekt in geschweiften Klammern.");
                MessageBox.Show(this,"JSON-Struktur ist gültig. Die Spielwirkung muss separat geprüft werden.",
                    "JSON validiert",MessageBoxButtons.OK,MessageBoxIcon.Information);
            }
            catch(Exception ex){Error(ex);}
        });
        stack.Controls.Add(helper);
        extra.TextChanged+=(_,_)=>
        {
            try
            {
                if(JsonNode.Parse(extra.Text) is not JsonObject)throw new JsonException();
                extra.BackColor=Color.FromArgb(48,42,54);
            }
            catch(JsonException){extra.BackColor=Color.FromArgb(93,41,47);}
        };
        tooltips.SetToolTip(extra,"Weitere Eigenschaften als JSON-Objekt: { \"source\": \"editor\" }");
    }
    void OrganizeEditorTabs(Panel scroll,FlowLayoutPanel oldStack)
    {
        var tabs=new TabControl {Dock=DockStyle.Fill,Font=new Font("Segoe UI",10)};
        var names=new[]{"Monster & Werte","Artwork","Kartendesign","Erweitert"};
        var lists=new FlowLayoutPanel[names.Length];
        for(int i=0;i<names.Length;i++)
        {
            var page=new TabPage(names[i]) {BackColor=Color.FromArgb(28,25,36)};
            var panel=new Panel {Dock=DockStyle.Fill,AutoScroll=true,
                Padding=new Padding(10),BackColor=page.BackColor};
            lists[i]=new FlowLayoutPanel {Dock=DockStyle.Top,AutoSize=true,
                FlowDirection=FlowDirection.TopDown,WrapContents=false,
                Width=540,BackColor=panel.BackColor};
            panel.Controls.Add(lists[i]);page.Controls.Add(panel);tabs.TabPages.Add(page);
        }
        int current=0;
        foreach(Control item in oldStack.Controls.Cast<Control>().ToArray())
        {
            if(item is Label heading)
                current=heading.Text switch {
                    "ARTWORK"=>1,"KARTENBAUKASTEN · SPIEL-ASSETS"=>2,
                    "ZUSÄTZLICHE SPIELWERTE"=>3,_=>current};
            oldStack.Controls.Remove(item);lists[current].Controls.Add(item);
        }
        scroll.Controls.Remove(oldStack);scroll.AutoScroll=false;
        scroll.Controls.Add(tabs);scroll.Padding=new Padding(4);
    }
}
