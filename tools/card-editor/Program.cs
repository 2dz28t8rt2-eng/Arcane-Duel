using System.Drawing.Drawing2D;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace ArcaneCardEditor;

internal static class Program
{
    [STAThread]
    static void Main(string[] args)
    {
        ApplicationConfiguration.Initialize();
        if (args.Contains("--self-test"))
        {
            Editor.SelfTest();
            return;
        }
        Application.Run(new Editor());
    }
}

internal sealed class Editor : Form
{
    readonly Dictionary<string, TextBox> fields = new();
    readonly Dictionary<string, CheckBox> flags = new();
    readonly TextBox extra = new() { Multiline = true, ScrollBars = ScrollBars.Both, Height = 110, Dock = DockStyle.Top, Font = new Font("Consolas", 9) };
    readonly CardPreview preview = new() { Dock = DockStyle.Fill };
    readonly Label artLabel = new() { AutoSize = true, MaximumSize = new Size(540, 0), Text = "Kein Bild ausgewählt" };
    readonly Label status = new() { Dock = DockStyle.Bottom, Height = 34, TextAlign = ContentAlignment.MiddleLeft, Padding = new Padding(8,0,0,0), Text = "Neue Karte · Änderungen werden nicht automatisch gespeichert." };
    JsonObject original = new();
    string? imagePath;
    readonly string[] numeric = { "id", "level", "atk", "def", "pveAtk", "pveDef" };
    readonly string[] boolKeys = { "fusionOnly", "ace", "fateTemplate", "playable", "essenceMonster", "lv1Exclusive" };
    static readonly JsonSerializerOptions Pretty = new() { WriteIndented = true };

    public Editor()
    {
        Text = "Arcane Duel · Karten-Editor";
        Width = 1200; Height = 850; MinimumSize = new Size(960, 650);
        StartPosition = FormStartPosition.CenterScreen;
        var bar = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 48, Padding = new Padding(5), WrapContents = false };
        AddButton(bar, "Neu", (_,_) => NewCard());
        AddButton(bar, "JSON öffnen", (_,_) => OpenCard());
        AddButton(bar, "JSON speichern", (_,_) => SaveCard());
        AddButton(bar, "Kartenpaket exportieren", (_,_) => ExportPackage());
        var split = new SplitContainer { Dock = DockStyle.Fill, SplitterDistance = 610, FixedPanel = FixedPanel.None };
        var scroll = new Panel { Dock = DockStyle.Fill, AutoScroll = true, Padding = new Padding(14) };
        var stack = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, FlowDirection = FlowDirection.TopDown, WrapContents = false, Width = 560 };
        scroll.Controls.Add(stack); split.Panel1.Controls.Add(scroll);
        split.Panel2.Padding = new Padding(18); split.Panel2.Controls.Add(preview);
        AddTitle(stack, "Kartendaten");
        AddField(stack,"id","Karten-ID (eindeutige ganze Zahl)","0");
        AddField(stack,"name","Name","Neue Karte");
        AddField(stack,"level","Stufe","1");
        AddField(stack,"atk","ATK","0");
        AddField(stack,"def","DEF","0");
        AddField(stack,"element","Element","FEUER");
        AddField(stack,"role","Rolle (z. B. guardian, combatant, predator, soul)","combatant");
        AddField(stack,"ability","Fähigkeitstext","",true);
        AddTitle(stack,"Artwork");
        var artRow = new FlowLayoutPanel { Width=530, Height=40, WrapContents=false };
        AddButton(artRow,"Bild auswählen",(_,_)=>SelectImage()); artRow.Controls.Add(artLabel); stack.Controls.Add(artRow);
        AddTitle(stack,"Zusätzliche Spielwerte");
        AddField(stack,"pveAtk","PvE-Bonus ATK","0");
        AddField(stack,"pveDef","PvE-Bonus DEF","0");
        AddField(stack,"essenceSchool","Essenz-Schule (leer = keine)","");
        foreach (var (key,label,value) in new[] { ("fusionOnly","Nur Fusion",false), ("ace","ACE",false), ("fateTemplate","Schicksalsvorlage",false), ("playable","Spielbar",true), ("essenceMonster","Essenzmonster",false), ("lv1Exclusive","Stufe-1-exklusiv",false) })
        {
            var c = new CheckBox { Text=label, Checked=value, AutoSize=true, Width=500 };
            c.CheckedChanged += (_,_)=>RefreshPreview(); flags[key]=c; stack.Controls.Add(c);
        }
        AddTitle(stack,"Weitere Eigenschaften (JSON)");
        stack.Controls.Add(new Label { Text="Für source, lv1Special, fusionReference und zukünftige Eigenschaften.", AutoSize=true, MaximumSize=new Size(520,0) });
        extra.Width=530; extra.Text="{}"; stack.Controls.Add(extra);
        Controls.Add(split); Controls.Add(bar); Controls.Add(status);
        NewCard();
    }
    void AddTitle(FlowLayoutPanel p,string text) => p.Controls.Add(new Label { Text=text, AutoSize=true, Font=new Font(Font,FontStyle.Bold), Margin=new Padding(3,14,3,5) });
    void AddField(FlowLayoutPanel p,string key,string label,string value,bool multi=false)
    {
        p.Controls.Add(new Label { Text=label, AutoSize=true, Margin=new Padding(3,7,3,2) });
        var box=new TextBox { Width=530, Text=value, Multiline=multi, Height=multi?70:27, ScrollBars=multi?ScrollBars.Vertical:ScrollBars.None };
        box.TextChanged+=(_,_)=>RefreshPreview(); fields[key]=box; p.Controls.Add(box);
    }
    static void AddButton(FlowLayoutPanel panel,string label,EventHandler handler)
    {
        var b=new Button { Text=label, AutoSize=true, Height=32, Padding=new Padding(8,0,8,0) }; b.Click+=handler; panel.Controls.Add(b);
    }
    void RefreshPreview()
    {
        if (!fields.ContainsKey("ability")) return;
        preview.CardName=fields["name"].Text; preview.Level=fields["level"].Text;
        preview.Attack=fields["atk"].Text; preview.Defense=fields["def"].Text;
        preview.Element=fields["element"].Text; preview.Role=fields["role"].Text;
        preview.Ability=fields["ability"].Text; preview.IsFusion=flags.TryGetValue("fusionOnly",out var f)&&f.Checked;
        preview.Invalidate();
    }
    void NewCard()
    {
        original=new JsonObject();
        foreach(var pair in fields) pair.Value.Text=pair.Key switch { "id"=>"0", "name"=>"Neue Karte", "level"=>"1", "role"=>"combatant", "element"=>"FEUER", "atk" or "def" or "pveAtk" or "pveDef"=>"0", _=>"" };
        foreach(var pair in flags) pair.Value.Checked=pair.Key=="playable";
        extra.Text="{}"; imagePath=null; artLabel.Text="Kein Bild ausgewählt"; preview.SetImage(null); RefreshPreview();
        status.Text="Neue Karte · ID vor dem Export mit dem Projekt abgleichen.";
    }
    void SelectImage()
    {
        using var dialog=new OpenFileDialog { Filter="Bilder (*.png;*.jpg;*.jpeg;*.bmp;*.gif)|*.png;*.jpg;*.jpeg;*.bmp;*.gif", Title="Kartenbild auswählen" };
        if(dialog.ShowDialog()!=DialogResult.OK)return;
        try { preview.SetImage(dialog.FileName); imagePath=dialog.FileName; artLabel.Text=Path.GetFileName(imagePath); }
        catch(Exception ex) { Error(ex); }
    }
    int Number(string key)
    {
        if(!int.TryParse(fields[key].Text,out var n)||n<0)throw new InvalidOperationException(key+" muss eine nicht negative ganze Zahl sein.");
        return n;
    }
    JsonObject BuildCard()
    {
        var obj=JsonNode.Parse(original.ToJsonString())!.AsObject();
        var advanced=JsonNode.Parse(extra.Text) as JsonObject ?? throw new InvalidOperationException("Weitere Eigenschaften müssen ein JSON-Objekt sein.");
        foreach(var item in advanced) obj[item.Key]=item.Value?.DeepClone();
        foreach(var key in numeric.Take(4))obj[key]=Number(key);
        if(string.IsNullOrWhiteSpace(fields["name"].Text))throw new InvalidOperationException("Bitte einen Namen eingeben.");
        if(Number("level")<1)throw new InvalidOperationException("Die Stufe muss mindestens 1 sein.");
        foreach(var key in new[]{"name","element","role","ability"})obj[key]=fields[key].Text.Trim();
        obj["essenceSchool"]=string.IsNullOrWhiteSpace(fields["essenceSchool"].Text)?null:JsonValue.Create(fields["essenceSchool"].Text.Trim());
        foreach(var pair in flags)obj[pair.Key]=pair.Value.Checked;
        var bonus=obj["pveBaseBonus"] as JsonObject ?? new JsonObject(); bonus["atk"]=Number("pveAtk");bonus["def"]=Number("pveDef");obj["pveBaseBonus"]=bonus.DeepClone();
        if(imagePath!=null)obj["art"]="assets/custom-art/editor/card-"+Number("id")+Path.GetExtension(imagePath).ToLowerInvariant();
        else if(!obj.ContainsKey("art"))obj["art"]="";
        if(!obj.ContainsKey("source"))obj["source"]=null;
        if(!obj.ContainsKey("lv1Special"))obj["lv1Special"]=null;
        return obj;
    }
    void ApplyCard(JsonObject obj,string baseDir)
    {
        original=(JsonObject)obj.DeepClone();
        foreach(var key in new[]{"id","name","level","atk","def","element","role","ability","essenceSchool"})
            fields[key].Text=obj[key]?.ToString()??"";
        fields["pveAtk"].Text=obj["pveBaseBonus"]?["atk"]?.ToString()??"0";
        fields["pveDef"].Text=obj["pveBaseBonus"]?["def"]?.ToString()??"0";
        foreach(var key in boolKeys) flags[key].Checked=obj[key]?.GetValue<bool>()??(key=="playable");
        var known=new HashSet<string>(new[]{"id","name","level","atk","def","element","role","ability","essenceSchool","pveBaseBonus","art"}.Concat(boolKeys));
        var others=new JsonObject();foreach(var p in obj)if(!known.Contains(p.Key))others[p.Key]=p.Value?.DeepClone();
        extra.Text=others.ToJsonString(Pretty);
        imagePath=null; preview.SetImage(null); artLabel.Text="Bildpfad: "+(obj["art"]?.ToString()??"nicht angegeben");
        var art=obj["art"]?.ToString();
        if(!string.IsNullOrWhiteSpace(art))
        {
            var candidate=Path.IsPathRooted(art)?art:Path.Combine(baseDir,art.Replace('/',Path.DirectorySeparatorChar));
            if(File.Exists(candidate))try { preview.SetImage(candidate); imagePath=candidate; artLabel.Text=Path.GetFileName(candidate); } catch {}
        }
        RefreshPreview();
    }
    void OpenCard()
    {
        using var d=new OpenFileDialog { Filter="JSON (*.json)|*.json" };
        if(d.ShowDialog()!=DialogResult.OK)return;
        try { var obj=JsonNode.Parse(File.ReadAllText(d.FileName,Encoding.UTF8)) as JsonObject ?? throw new InvalidOperationException("Die Datei muss ein Karten-JSON-Objekt enthalten."); if(obj.ContainsKey("cards"))throw new InvalidOperationException("Bitte eine einzelne Karte öffnen, keinen vollständigen Katalog."); ApplyCard(obj,Path.GetDirectoryName(d.FileName)!); status.Text="Karte geladen. Bitte Bild und Werte prüfen."; }
        catch(Exception ex){Error(ex);}
    }
    void SaveCard()
    {
        try {
            var card=BuildCard(); using var d=new SaveFileDialog { Filter="JSON (*.json)|*.json", FileName="karte-"+Number("id")+".json" };
            if(d.ShowDialog()!=DialogResult.OK)return;
            File.WriteAllText(d.FileName,card.ToJsonString(Pretty),new UTF8Encoding(false)); status.Text="JSON gespeichert. Bild separat aufbewahren; für die Übergabe das Kartenpaket verwenden.";
        } catch(Exception ex){Error(ex);}
    }
    internal static void SelfTest()
    {
        using var editor=new Editor();
        var sample=JsonNode.Parse("{\"id\":42,\"name\":\"Testkarte\",\"level\":2,\"atk\":100,\"def\":80,\"element\":\"FEUER\",\"role\":\"guardian\",\"ability\":\"Test\",\"pveBaseBonus\":{\"atk\":10,\"def\":20},\"future\":{\"value\":1}}")!.AsObject();
        editor.ApplyCard(sample,Path.GetTempPath());
        var image=Path.Combine(Path.GetTempPath(),Guid.NewGuid()+".png");
        var zip=Path.Combine(Path.GetTempPath(),Guid.NewGuid()+".zip");
        try
        {
            using(var bitmap=new Bitmap(40,40)){using var g=Graphics.FromImage(bitmap);g.Clear(Color.CornflowerBlue);bitmap.Save(image,System.Drawing.Imaging.ImageFormat.Png);}
            editor.imagePath=image;editor.preview.SetImage(image);
            var card=editor.BuildCard();
            if(card["id"]!.GetValue<int>()!=42||card["atk"]!.GetValue<int>()!=100||card["pveBaseBonus"]!["def"]!.GetValue<int>()!=20||card["future"]!["value"]!.GetValue<int>()!=1)throw new InvalidOperationException("Card round-trip failed");
            editor.preview.Size=new Size(400,620);
            using(var rendered=new Bitmap(400,620))editor.preview.DrawToBitmap(rendered,new Rectangle(0,0,400,620));
            WritePackage(zip,card,image);
            using var archive=ZipFile.OpenRead(zip);
            if(archive.GetEntry("card.json")==null||archive.GetEntry(card["art"]!.GetValue<string>())==null||archive.GetEntry("BITTE-LESEN.txt")==null)throw new InvalidOperationException("Package is incomplete");
            using var reader=new StreamReader(archive.GetEntry("card.json")!.Open());
            if(JsonNode.Parse(reader.ReadToEnd())!["name"]!.GetValue<string>()!="Testkarte")throw new InvalidOperationException("Package card data failed");
        }
        finally { if(File.Exists(image))File.Delete(image);if(File.Exists(zip))File.Delete(zip); }
    }
    static void WritePackage(string path,JsonObject card,string image)
    {
        using var file=new FileStream(path,FileMode.Create,FileAccess.Write,FileShare.None);
        using var archive=new ZipArchive(file,ZipArchiveMode.Create);
        var json=archive.CreateEntry("card.json");
        using(var writer=new StreamWriter(json.Open(),new UTF8Encoding(false)))writer.Write(card.ToJsonString(Pretty));
        archive.CreateEntryFromFile(image,card["art"]!.GetValue<string>());
        var info=archive.CreateEntry("BITTE-LESEN.txt");
        using(var w=new StreamWriter(info.Open(),new UTF8Encoding(false)))w.Write("Kartenentwurf für Arcane Duel\n\ncard.json und das Bild enthalten die eingegebenen Daten. Dieses Paket wird NICHT automatisch vom Spiel eingelesen. Ein Entwickler muss ID, Bildpfad, Freischaltung, Fusionen und Fähigkeiten prüfen und die Karte in die maßgeblichen Spieldaten sowie gegebenenfalls das Online-Backend integrieren. Fähigkeitstext allein erzeugt keine Spielmechanik.\n");
    }
    void ExportPackage()
    {
        try {
            if(imagePath==null||!File.Exists(imagePath))throw new InvalidOperationException("Bitte zuerst ein Kartenbild auswählen.");
            var card=BuildCard(); var art=card["art"]!.GetValue<string>();
            using var d=new SaveFileDialog { Filter="ZIP-Paket (*.zip)|*.zip", FileName="Arcane-Karte-"+Number("id")+".zip" };
            if(d.ShowDialog()!=DialogResult.OK)return;
            WritePackage(d.FileName,card,imagePath);
            status.Text="Kartenpaket exportiert. Integration ins Spiel erfolgt durch den Entwickler.";
        }catch(Exception ex){Error(ex);}
    }
    void Error(Exception ex)=>MessageBox.Show(this,ex.Message,"Karten-Editor",MessageBoxButtons.OK,MessageBoxIcon.Warning);
}

internal sealed class CardPreview : Control
{
    public string CardName="",Level="",Attack="",Defense="",Element="",Role="",Ability="";
    public bool IsFusion;
    Image? art;
    public CardPreview(){DoubleBuffered=true; BackColor=Color.FromArgb(28,25,36);}
    public void SetImage(string? path)
    {
        Image? next=null;
        if(path!=null){using var source=Image.FromFile(path);next=new Bitmap(source);}
        var old=art;art=next;old?.Dispose();Invalidate();
    }
    protected override void Dispose(bool disposing){if(disposing)art?.Dispose();base.Dispose(disposing);}
    protected override void OnPaint(PaintEventArgs e)
    {
        base.OnPaint(e); var g=e.Graphics;g.SmoothingMode=SmoothingMode.AntiAlias;
        float scale=Math.Min((Width-20)/360f,(Height-20)/570f);if(scale<=0)return;
        g.TranslateTransform((Width-360*scale)/2,(Height-570*scale)/2);g.ScaleTransform(scale,scale);
        using var frame=new SolidBrush(IsFusion?Color.FromArgb(105,67,115):Color.FromArgb(127,86,44));
        using var panel=new SolidBrush(Color.FromArgb(233,218,181));using var ink=new SolidBrush(Color.FromArgb(43,30,24));
        using var dim=new SolidBrush(Color.FromArgb(65,53,49));using var gold=new Pen(Color.FromArgb(208,172,100),4);
        g.FillRectangle(frame,0,0,360,570);g.DrawRectangle(gold,5,5,350,560);
        g.FillRectangle(panel,18,18,324,50);g.FillRectangle(dim,18,76,324,280);g.FillRectangle(panel,18,363,324,187);
        using var title=new Font("Segoe UI",15,FontStyle.Bold);using var text=new Font("Segoe UI",11);using var small=new Font("Segoe UI",9);
        g.DrawString(CardName,title,ink,new RectangleF(27,25,305,40));
        if(art!=null){float ratio=Math.Max(324f/art.Width,280f/art.Height);float w=art.Width*ratio,h=art.Height*ratio;var state=g.Save();g.SetClip(new RectangleF(18,76,324,280));g.DrawImage(art,18+(324-w)/2,76+(280-h)/2,w,h);g.Restore(state);}
        else g.DrawString("BILDVORSCHAU",text,Brushes.White,new RectangleF(85,195,220,40));
        g.DrawString("Stufe "+Level+"   ·   "+Element+"   ·   "+Role,text,ink,new RectangleF(28,375,305,48));
        g.DrawString(Ability,small,ink,new RectangleF(28,416,304,75));
        g.DrawString("ATK "+Attack+"     DEF "+Defense,title,ink,new RectangleF(28,502,305,38));
    }
}