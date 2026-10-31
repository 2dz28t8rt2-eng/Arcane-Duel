using System.Drawing.Drawing2D;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Svg;

namespace ArcaneCardEditor;

internal static class Program
{
    [STAThread]
    static void Main(string[] args)
    {
        ApplicationConfiguration.Initialize();
        if (args.Contains("--self-test"))
        {
            try { Editor.SelfTest(); }
            catch (Exception ex)
            {
                File.WriteAllText(Path.Combine(AppContext.BaseDirectory,"card-editor-selftest-failure.txt"),ex.ToString());
                Environment.ExitCode=1;
            }
            return;
        }
        Application.Run(new Editor());
    }
}

internal sealed partial class Editor : Form
{
    readonly Dictionary<string, TextBox> fields = new();
    readonly Dictionary<string, CheckBox> flags = new();
    readonly TextBox extra = new() { Multiline = true, ScrollBars = ScrollBars.Both, Height = 110, Dock = DockStyle.Top, Font = new Font("Consolas", 9) };
    readonly CardPreview preview = new() { Dock = DockStyle.Fill };
    readonly GameCardWebPreview gamePreview = new() { Dock = DockStyle.Fill };
    readonly Label artLabel = new() { AutoSize = true, MaximumSize = new Size(540, 0), Text = "Kein Bild ausgewählt" };
    readonly Label status = new() { Dock = DockStyle.Bottom, Height = 34, TextAlign = ContentAlignment.MiddleLeft, Padding = new Padding(8,0,0,0), Text = "Neue Karte · Änderungen werden nicht automatisch gespeichert." };
    private sealed record Choice(string Id,string Label) { public override string ToString()=>Label; }
    readonly ComboBox frames = new() { DropDownStyle=ComboBoxStyle.DropDownList,Width=530 };
    readonly ComboBox ornaments = new() { DropDownStyle=ComboBoxStyle.DropDownList,Width=530 };
    readonly ComboBox icons = new() { DropDownStyle=ComboBoxStyle.DropDownList,Width=530 };
    Color backgroundAccent = Color.FromArgb(111,77,122);
    bool accentChanged;
    byte[]? customFrameBytes;
    string? customFrameExtension;
    JsonObject original = new();
    byte[]? imageBytes;
    string? imageExtension;
    readonly string[] numeric = { "id", "level", "atk", "def", "pveAtk", "pveDef" };
    readonly string[] boolKeys = { "fusionOnly", "ace", "fateTemplate", "playable", "essenceMonster", "lv1Exclusive" };
    static readonly JsonSerializerOptions Pretty = new() { WriteIndented = true };
    static string ColorHex(Color color) => $"#{color.R:X2}{color.G:X2}{color.B:X2}";

    public Editor()
    {
        Text = "Arcane Duel · Karten-Editor";
        Width = 1200; Height = 850; MinimumSize = new Size(960, 650);
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = Color.FromArgb(24,21,33); ForeColor = Color.FromArgb(237,229,213);
        Font = new Font("Segoe UI", 10);
        var root = new TableLayoutPanel { Dock=DockStyle.Fill, ColumnCount=1, RowCount=4, BackColor=BackColor };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent,100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute,78)); root.RowStyles.Add(new RowStyle(SizeType.Absolute,94));
        root.RowStyles.Add(new RowStyle(SizeType.Percent,100)); root.RowStyles.Add(new RowStyle(SizeType.Absolute,34));
        var header = new Panel { Dock=DockStyle.Fill, BackColor=Color.FromArgb(34,29,43), Padding=new Padding(22,10,10,8) };
        var title = new Label { Text="ARCANE DUEL", AutoSize=true, Font=new Font("Segoe UI",16,FontStyle.Bold), ForeColor=Color.FromArgb(225,186,112), Location=new Point(20,8) };
        var subtitle = new Label { Text="KARTEN-EDITOR  ·  ERSCHAFFE DEINE NÄCHSTE KARTE", AutoSize=true, Font=new Font("Segoe UI",8,FontStyle.Bold), ForeColor=Color.FromArgb(176,164,151), Location=new Point(22,45) };
        header.Controls.Add(title); header.Controls.Add(subtitle);
        var bar = new FlowLayoutPanel { Dock=DockStyle.Fill, Padding=new Padding(15,5,5,5), WrapContents=true, AutoScroll=true, BackColor=Color.FromArgb(42,36,52) };
        AddButton(bar, "Kartenpaket speichern", (_,_) => ExportPackage(), true);
        AddButton(bar, "Neu", (_,_) => NewCard());
        AddButton(bar, "Karte öffnen", (_,_) => OpenCard());
        AddButton(bar, "Bestehende Karten bearbeiten", (_,_) => OpenExistingCard());
        AddButton(bar, "JSON speichern", (_,_) => SaveCard());
        AddButton(bar, "PNG-Vorschau", (_,_) => ExportPreview());
         AddButton(bar, "Zur Ablage hinzufügen", (_,_) => AddToShelf());
         AddButton(bar, "Ablage öffnen", (_,_) => OpenShelf());
         AddButton(bar, "Alle exportieren (ZIP)", (_,_) => ExportShelf(), true);
         AddButton(bar, "Clear – Ablage leeren", (_,_) => ClearShelf());
        var split = new SplitContainer { Dock=DockStyle.Fill, SplitterDistance=610, FixedPanel=FixedPanel.None, BackColor=Color.FromArgb(56,47,62) };
        var scroll = new Panel { Dock=DockStyle.Fill, AutoScroll=true, Padding=new Padding(18), BackColor=Color.FromArgb(28,25,36) };
        var stack = new FlowLayoutPanel { Dock=DockStyle.Top, AutoSize=true, FlowDirection=FlowDirection.TopDown, WrapContents=false, Width=560, BackColor=scroll.BackColor };
        scroll.Controls.Add(stack); split.Panel1.Controls.Add(scroll);
        split.Panel2.BackColor=Color.FromArgb(24,21,33); split.Panel2.Padding=new Padding(18);
        var previewLabel=new Label { Dock=DockStyle.Top, Height=28, Text="LIVE-VORSCHAU", TextAlign=ContentAlignment.MiddleCenter, ForeColor=Color.FromArgb(193,164,112), Font=new Font("Segoe UI",9,FontStyle.Bold) };
        split.Panel2.Controls.Add(preview); split.Panel2.Controls.Add(gamePreview); split.Panel2.Controls.Add(previewLabel);
        AddTitle(stack, "Kartendaten");
        AddField(stack,"id","Karten-ID (eindeutige ganze Zahl)","");
        AddField(stack,"name","Name","Neue Karte");
        AddField(stack,"level","Stufe","1");
        AddField(stack,"atk","ATK","0");
        AddField(stack,"def","DEF","0");
        AddField(stack,"element","Element","FEUER");
        AddField(stack,"role","Rolle (z. B. guardian, combatant, predator, soul)","combatant");
        AddField(stack,"ability","Fähigkeitstext","",true);
        AddField(stack,"desc","Beschreibung","",true);
        AddField(stack,"tags","Tags (Komma-getrennt)","");
        AddField(stack,"rarity","Seltenheit","common");
        AddField(stack,"kind","Monsterart","spirit");
        AddField(stack,"roleStyle","Rollenstil / Spezialisierung","");
        AddTitle(stack,"Artwork");
        var artRow = new FlowLayoutPanel { Width=530, Height=40, WrapContents=false };
        AddButton(artRow,"Bild auswählen",(_,_)=>SelectImage());
        AddButton(artRow,"Artwork aus bestehenden Karten",(_,_)=>SelectCatalogImage());
        stack.Controls.Add(artRow);stack.Controls.Add(artLabel);
        AddTitle(stack,"Kartenbaukasten · Spiel-Assets");
        stack.Controls.Add(new Label { Text="20 Originalrahmen, 40 Level-Gravuren und 8 Rollensymbole sind im Editor enthalten.",
          MaximumSize=new Size(530,0),AutoSize=true });
        AddFieldLabel(stack,"Kartenrahmen");stack.Controls.Add(frames);
        AddFieldLabel(stack,"Level-Verzierung");stack.Controls.Add(ornaments);
        AddFieldLabel(stack,"Rollensymbol");stack.Controls.Add(icons);
        foreach(var combo in new[]{frames,ornaments,icons}){
          combo.BackColor=Color.FromArgb(50,42,60);combo.ForeColor=ForeColor;
          combo.SelectedIndexChanged+=(_,_)=>RefreshPreview();
        }
        frames.Items.Add(new Choice("auto","Auto · dem Level und Typ entsprechend"));
        foreach(var f in AssetCatalog.Frames)frames.Items.Add(new Choice(f.Id,f.Label));
        ornaments.Items.Add(new Choice("auto","Auto · passend zum Kartenrahmen"));
        ornaments.Items.Add(new Choice("none","Ohne Level-Ornament"));
        foreach(var id in AssetCatalog.Levels)ornaments.Items.Add(new Choice(id,id));
        icons.Items.Add(new Choice("auto","Auto · der Rolle entsprechend"));
        icons.Items.Add(new Choice("none","Ohne Symbol"));
        foreach(var id in AssetCatalog.Icons)icons.Items.Add(new Choice(id,id));
        frames.SelectedIndex=ornaments.SelectedIndex=icons.SelectedIndex=0;
        var editorRow=new FlowLayoutPanel { Width=530,Height=43,WrapContents=false };
        AddButton(editorRow,"Eigenen Rahmen (SVG/PNG)",(_,_)=>SelectFrame());
        AddButton(editorRow,"Farben wählen",(_,_)=>ChooseColor());
        stack.Controls.Add(editorRow);
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
        extra.BackColor=Color.FromArgb(48,42,54); extra.ForeColor=ForeColor; extra.BorderStyle=BorderStyle.FixedSingle;
        status.BackColor=Color.FromArgb(34,29,43); status.ForeColor=Color.FromArgb(195,185,173);
        root.Controls.Add(header,0,0); root.Controls.Add(bar,0,1); root.Controls.Add(split,0,2); root.Controls.Add(status,0,3);
        Controls.Add(root);
        SetupInputAssist(stack);
        SetupIntegrationControls(stack);
        OrganizeEditorTabs(scroll,stack);
        RestoreShelf();
        NewCard();
    }
    void AddTitle(FlowLayoutPanel p,string text) => p.Controls.Add(new Label { Text=text.ToUpperInvariant(), AutoSize=true, ForeColor=Color.FromArgb(225,186,112), Font=new Font("Segoe UI",10,FontStyle.Bold), Margin=new Padding(3,18,3,7) });
    static void AddFieldLabel(FlowLayoutPanel p,string label)=>p.Controls.Add(new Label { Text=label,AutoSize=true,Margin=new Padding(3,7,3,2) });
    void AddField(FlowLayoutPanel p,string key,string label,string value,bool multi=false)
    {
        p.Controls.Add(new Label { Text=label, AutoSize=true, Margin=new Padding(3,7,3,2) });
        var box=new TextBox { Width=530, Text=value, Multiline=multi, Height=multi?70:27, ScrollBars=multi?ScrollBars.Vertical:ScrollBars.None, BackColor=Color.FromArgb(48,42,54), ForeColor=Color.FromArgb(245,239,228), BorderStyle=BorderStyle.FixedSingle };
        box.TextChanged+=(_,_)=>RefreshPreview(); fields[key]=box; p.Controls.Add(box);
    }
    static void AddButton(FlowLayoutPanel panel,string label,EventHandler handler,bool primary=false)
    {
        var b=new Button { Text=label, AutoSize=true, Height=36, Padding=new Padding(14,0,14,0), FlatStyle=FlatStyle.Flat, Cursor=Cursors.Hand, BackColor=primary?Color.FromArgb(195,148,73):Color.FromArgb(69,60,74), ForeColor=primary?Color.FromArgb(29,24,26):Color.FromArgb(240,231,218), Font=new Font("Segoe UI",9,FontStyle.Bold), Margin=new Padding(3,2,5,2) };
        b.FlatAppearance.BorderSize=0; b.FlatAppearance.MouseOverBackColor=primary?Color.FromArgb(222,174,96):Color.FromArgb(89,77,93);
        b.Click+=handler; panel.Controls.Add(b);
    }
    void RefreshPreview()
    {
        if (!fields.ContainsKey("ability")) return;
        preview.CardName=fields["name"].Text; preview.Level=fields["level"].Text;
        preview.Attack=fields["atk"].Text; preview.Defense=fields["def"].Text;
        preview.Element=fields["element"].Text; preview.Role=fields["role"].Text;
        preview.Ability=fields["ability"].Text; preview.Description=fields["desc"].Text;
        preview.Tags=fields["tags"].Text;
        preview.IsFusion=flags.TryGetValue("fusionOnly",out var f)&&f.Checked;
        preview.IsAce=flags.TryGetValue("ace",out var a)&&a.Checked;
        preview.IsEssence=flags.TryGetValue("essenceMonster",out var e)&&e.Checked;
        preview.FrameId=ChoiceId(frames);
        preview.LevelDecoration=ChoiceId(ornaments);
        preview.RoleIcon=ChoiceId(icons);
        preview.Accent=backgroundAccent;
        preview.Invalidate();
        var selectedRoleIcon=ChoiceId(icons);
        var activeIcon=selectedRoleIcon=="auto" ? fields["role"].Text.ToLowerInvariant() switch
        {
            "guardian" or "defender"=>"guardian-shield",
            "soul"=>"soul-spiral","predator"=>"predator-skull",
            "resonator" or "weaver"=>"weaver-rune",
            "support"=>"support-star","hunter"=>"hunter-arrow",
            _=>"combatant-swords"
        } : selectedRoleIcon;
        var artwork=imageBytes??AssetCatalog.ArtworkPreview(original["art"]?.ToString());
        var artUri=artwork!=null ?
            "data:image/" + (imageBytes!=null && imageExtension==".png"?"png":
                imageBytes!=null && imageExtension==".gif"?"gif":
                imageBytes!=null && imageExtension==".bmp"?"bmp":"jpeg") +
            ";base64," + Convert.ToBase64String(artwork) : "";
        var frameUri=customFrameBytes==null?"": "data:image/" +
            (customFrameExtension==".svg"?"svg+xml":"png") + ";base64," +
            Convert.ToBase64String(customFrameBytes);
        gamePreview.UpdateCard(new
        {
            id=fields["id"].Text, name=fields["name"].Text,
            level=fields["level"].Text,atk=fields["atk"].Text,def=fields["def"].Text,
            role=fields["role"].Text,element=fields["element"].Text,
            ability=fields["ability"].Text, art=artUri,
            fusionOnly=preview.IsFusion, ace=preview.IsAce,
            essenceMonster=preview.IsEssence,frameTemplate=ChoiceId(frames),
            frameLevelOverlay=ChoiceId(ornaments),frameRoleIcon=ChoiceId(icons),
            frameUrl=frameUri,accent=ColorHex(backgroundAccent),customAccent=accentChanged,
            description=fields["desc"].Text, tags=fields["tags"].Text,
            iconUrl=selectedRoleIcon=="none"?"":AssetCatalog.IconDataUri(activeIcon)
        });
    }
    static string ChoiceId(ComboBox picker)=>picker.SelectedItem is Choice o?o.Id:"auto";
    static void SetChoice(ComboBox picker,string? id)
    {
      int i=picker.Items.Cast<Choice>().ToList().FindIndex(x=>x.Id==(id??"auto"));
      picker.SelectedIndex=i<0?0:i;
    }
    void ChooseColor()
    {
      using var picker=new ColorDialog { Color=backgroundAccent,FullOpen=true };
      if(picker.ShowDialog(this)==DialogResult.OK){backgroundAccent=picker.Color;accentChanged=true;RefreshPreview();}
    }
    void NewCard()
    {
        original=new JsonObject();
        foreach(var pair in fields) pair.Value.Text=pair.Key switch { "id"=>"", "name"=>"Neue Karte", "level"=>"1", "role"=>"combatant", "element"=>"FEUER", "rarity"=>"common", "kind"=>"spirit", "atk" or "def" or "pveAtk" or "pveDef"=>"0", _=>"" };
        foreach(var pair in flags) pair.Value.Checked=pair.Key=="playable";
        extra.Text="{}";imageBytes=null;imageExtension=null;
        customFrameBytes=null;customFrameExtension=null;preview.SetCustomFrame(null,null);
        artLabel.Text="Kein Bild ausgewählt";preview.SetImage(null);
        SetChoice(frames,"auto");SetChoice(ornaments,"auto");SetChoice(icons,"auto");
        backgroundAccent=Color.FromArgb(111,77,122);accentChanged=false;
        ResetIntegrationForCard();RefreshPreview();
        status.Text="Neue Karte · ID vor dem Export mit dem Projekt abgleichen.";
    }
    void SelectImage()
    {
        using var dialog=new OpenFileDialog { Filter="Bilder (*.png;*.jpg;*.jpeg;*.bmp;*.gif)|*.png;*.jpg;*.jpeg;*.bmp;*.gif", Title="Kartenbild auswählen" };
        if(dialog.ShowDialog()!=DialogResult.OK)return;
        try { var bytes=File.ReadAllBytes(dialog.FileName); preview.SetImage(bytes); imageBytes=bytes; imageExtension=Path.GetExtension(dialog.FileName).ToLowerInvariant(); artLabel.Text=Path.GetFileName(dialog.FileName); RefreshPreview(); }
        catch(Exception ex) { Error(ex); }
    }
    void OpenExistingCard()
    {
      using var picker=new CardPicker();
      if(picker.ShowDialog(this)!=DialogResult.OK||picker.SelectedCard==null)return;
      ApplyCard(picker.SelectedCard,AppContext.BaseDirectory);
      status.Text="Bestehende Karte aus dem originalen Katalog geladen · lokal bearbeitbar.";
    }
    void SelectCatalogImage()
    {
      using var picker=new CardPicker(true);
      if(picker.ShowDialog(this)!=DialogResult.OK||picker.SelectedCard==null)return;
      var art=picker.SelectedCard["art"]?.ToString();
      if(string.IsNullOrWhiteSpace(art))return;
      original["art"]=art;imageBytes=null;imageExtension=null;
      preview.SetImage(AssetCatalog.ArtworkPreview(art));
      artLabel.Text="Original-Asset: "+art;
      RefreshPreview();
    }
    void SelectFrame()
    {
      using var picker=new OpenFileDialog { Title="Transparenter Kartenrahmen",
        Filter="SVG und PNG (*.svg;*.png)|*.svg;*.png" };
      if(picker.ShowDialog(this)!=DialogResult.OK)return;
      try {
        var data=File.ReadAllBytes(picker.FileName);
        if(data.Length>2_000_000)throw new InvalidOperationException("Rahmen darf höchstens 2 MB groß sein.");
        var ext=Path.GetExtension(picker.FileName).ToLowerInvariant();
        preview.SetCustomFrame(data,ext);
        customFrameBytes=data;customFrameExtension=ext;
        frames.Items.Add(new Choice("custom","Eigenes Design: "+Path.GetFileName(picker.FileName)));
        frames.SelectedIndex=frames.Items.Count-1;
        status.Text="Eigener Rahmen geladen; im ZIP wird dieser mitexportiert.";
      } catch(Exception ex){Error(ex);}
    }
    async void ExportPreview()
    {
      try {
        using var picker=new SaveFileDialog { Filter="PNG (*.png)|*.png",
          FileName="Arcane-Karte-"+Number("id")+"-Vorschau.png" };
        if(picker.ShowDialog(this)!=DialogResult.OK)return;
        using var bitmap=new Bitmap(720,1140);
        preview.DrawPreview(bitmap);
        bitmap.Save(picker.FileName,System.Drawing.Imaging.ImageFormat.Png);
        status.Text="PNG-Vorschau exportiert.";
      }catch(Exception ex){Error(ex);}
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
        foreach(var key in new[]{"name","element","role","ability","desc","rarity","kind","roleStyle"})
            obj[key]=fields[key].Text.Trim();
        obj["tags"]=new JsonArray(fields["tags"].Text.Split(',',StringSplitOptions.TrimEntries|StringSplitOptions.RemoveEmptyEntries)
            .Select(x=>(JsonNode?)JsonValue.Create(x)).ToArray());
        obj["frameTemplate"]=ChoiceId(frames);
        obj["frameLevelOverlay"]=ChoiceId(ornaments);
        obj["frameRoleIcon"]=ChoiceId(icons);
        obj["frameAccent"]=ColorHex(backgroundAccent);
        if(ChoiceId(frames)=="custom"&&customFrameBytes!=null&&customFrameExtension!=null)
            obj["customFrame"]="assets/card-templates/editor/card-"+Number("id")+"-frame"+customFrameExtension;
        obj["essenceSchool"]=string.IsNullOrWhiteSpace(fields["essenceSchool"].Text)?null:JsonValue.Create(fields["essenceSchool"].Text.Trim());
        foreach(var pair in flags)obj[pair.Key]=pair.Value.Checked;
        var bonus=obj["pveBaseBonus"] as JsonObject ?? new JsonObject(); bonus["atk"]=Number("pveAtk");bonus["def"]=Number("pveDef");obj["pveBaseBonus"]=bonus.DeepClone();
        if(imageBytes!=null&&imageExtension!=null)obj["art"]="assets/custom-art/editor/card-"+Number("id")+imageExtension;
        else if(!obj.ContainsKey("art"))obj["art"]="";
        if(!obj.ContainsKey("source"))obj["source"]=null;
        if(!obj.ContainsKey("lv1Special"))obj["lv1Special"]=null;
        return obj;
    }
    void ApplyCard(JsonObject obj,string baseDir)
    {
        original=(JsonObject)obj.DeepClone();
        foreach(var key in new[]{"id","name","level","atk","def","element","role","ability","desc","rarity","kind","roleStyle","essenceSchool"})
            fields[key].Text=obj[key]?.ToString()??"";
        fields["tags"].Text=obj["tags"] is JsonArray tags?
            string.Join(", ",tags.Select(x=>x?.ToString()??"")):obj["tags"]?.ToString()??"";
        fields["pveAtk"].Text=obj["pveBaseBonus"]?["atk"]?.ToString()??"0";
        fields["pveDef"].Text=obj["pveBaseBonus"]?["def"]?.ToString()??"0";
        foreach(var key in boolKeys) flags[key].Checked=obj[key]?.GetValue<bool>()??(key=="playable");
        SetChoice(frames,obj["frameTemplate"]?.ToString());
        SetChoice(ornaments,obj["frameLevelOverlay"]?.ToString());
        SetChoice(icons,obj["frameRoleIcon"]?.ToString());
        accentChanged=false;
        if(obj["frameAccent"]!=null)try{backgroundAccent=ColorTranslator.FromHtml(obj["frameAccent"]!.ToString());accentChanged=backgroundAccent.ToArgb()!=Color.FromArgb(111,77,122).ToArgb();}catch{}
        customFrameBytes=null;customFrameExtension=null;preview.SetCustomFrame(null,null);
        var known=new HashSet<string>(new[]{"id","name","level","atk","def","element","role","ability","desc",
          "rarity","kind","roleStyle","tags","frameTemplate","frameLevelOverlay","frameRoleIcon",
          "frameAccent","customFrame","essenceSchool","pveBaseBonus","art"}.Concat(boolKeys));
        var others=new JsonObject();foreach(var p in obj)if(!known.Contains(p.Key))others[p.Key]=p.Value?.DeepClone();
        extra.Text=others.ToJsonString(Pretty);
        imageBytes=null; imageExtension=null; preview.SetImage(null); artLabel.Text="Bildpfad: "+(obj["art"]?.ToString()??"nicht angegeben");
        var art=obj["art"]?.ToString();
        if(!string.IsNullOrWhiteSpace(art))
        {
            var candidate=Path.IsPathRooted(art)?art:Path.Combine(baseDir,art.Replace('/',Path.DirectorySeparatorChar));
            if(File.Exists(candidate))try { var bytes=File.ReadAllBytes(candidate); preview.SetImage(bytes);
                // Preserve canonical game artwork paths; loading an existing file
                // for preview must not silently turn it into a new custom-art asset.
                if(!art.Replace('\\','/').StartsWith("assets/",StringComparison.OrdinalIgnoreCase))
                { imageBytes=bytes; imageExtension=Path.GetExtension(candidate).ToLowerInvariant(); }
                artLabel.Text=Path.GetFileName(candidate); } catch {}
        }
        if(imageBytes==null && !string.IsNullOrWhiteSpace(art))
        {
            var thumb=AssetCatalog.ArtworkPreview(art);
            if(thumb!=null){preview.SetImage(thumb);artLabel.Text="Original-Artwork: "+art;}
        }
        ResetIntegrationForCard(obj);
        RefreshPreview();
    }
    void LoadPackage(string path)
    {
        using var archive=ZipFile.OpenRead(path);
        var entry=archive.GetEntry("card.json") ?? throw new InvalidOperationException("Das Paket enthält keine card.json.");
        if(entry.Length>2_000_000)throw new InvalidOperationException("Die Kartendaten sind zu groß.");
        using var reader=new StreamReader(entry.Open(),Encoding.UTF8);
        var obj=JsonNode.Parse(reader.ReadToEnd()) as JsonObject ?? throw new InvalidOperationException("Ungültige Kartendaten.");
        string art=obj["art"]?.ToString()??"";
        var image=string.IsNullOrEmpty(art)?null:archive.GetEntry(art);
        if(image!=null&&image.Length>32_000_000)throw new InvalidOperationException("Artwork zu groß.");
        ApplyCard(obj,Path.GetDirectoryName(path)!);
        if(image!=null)
        {
            var extension=Path.GetExtension(art).ToLowerInvariant();
            if(!new[]{".png",".jpg",".jpeg",".bmp",".gif"}.Contains(extension))
                throw new InvalidOperationException("Nicht unterstütztes Artwork-Format.");
            using var stream=image.Open();using var buffer=new MemoryStream();
            stream.CopyTo(buffer);var bytes=buffer.ToArray();
            preview.SetImage(bytes);imageBytes=bytes;imageExtension=extension;
            artLabel.Text=Path.GetFileName(art);
        }
        var frameArt=obj["customFrame"]?.ToString();
        var frameEntry=string.IsNullOrEmpty(frameArt)?null:archive.GetEntry(frameArt);
        if(frameEntry!=null)
        {
            if(frameEntry.Length>2_000_000)throw new InvalidOperationException("Eigener Rahmen zu groß.");
            using var stream=frameEntry.Open();using var buffer=new MemoryStream();stream.CopyTo(buffer);
            customFrameBytes=buffer.ToArray();
            customFrameExtension=Path.GetExtension(frameArt).ToLowerInvariant();
            preview.SetCustomFrame(customFrameBytes,customFrameExtension);
            frames.Items.Add(new Choice("custom","Eigener Rahmen aus ZIP"));
            frames.SelectedIndex=frames.Items.Count-1;
        }
        var policyEntry=archive.GetEntry("integration.json");
        if(policyEntry!=null)
        {
            using var policyReader=new StreamReader(policyEntry.Open(),Encoding.UTF8);
            var policy=JsonNode.Parse(policyReader.ReadToEnd()) as JsonObject;
            if(policy!=null)ApplyPlan(new CardIntegrationPlan
            {
                Availability=policy["availability"]?.ToString()??"catalog-only",
                Booster=policy["booster"]?.GetValue<bool>()??false,
                StarterDeck=policy["starterDeck"]?.GetValue<bool>()??false,
                QuestReward=policy["questReward"]?.GetValue<bool>()??false,
                UnlockDetails=policy["unlockDetails"]?.ToString()??""
            });
        }
        RefreshPreview();
    }
    void OpenCard()
    {
        using var d=new OpenFileDialog { Filter="Kartenpaket oder JSON (*.zip;*.json)|*.zip;*.json|Kartenpaket (*.zip)|*.zip|JSON (*.json)|*.json" };
        if(d.ShowDialog()!=DialogResult.OK)return;
        try {
            if(Path.GetExtension(d.FileName).Equals(".zip",StringComparison.OrdinalIgnoreCase))LoadPackage(d.FileName);
            else { var obj=JsonNode.Parse(File.ReadAllText(d.FileName,Encoding.UTF8)) as JsonObject ?? throw new InvalidOperationException("Die Datei muss ein Karten-JSON-Objekt enthalten."); if(obj.ContainsKey("cards"))throw new InvalidOperationException("Bitte eine einzelne Karte öffnen, keinen vollständigen Katalog."); ApplyCard(obj,Path.GetDirectoryName(d.FileName)!); }
            status.Text="Karte geladen. Bitte Bild und Werte prüfen.";
        } catch(Exception ex){Error(ex);}
    }
    void SaveCard()
    {
        try {
            var draft=Snapshot();
            if(!ConfirmIntent(new[]{draft}))return;
            var card=draft.Card; using var d=new SaveFileDialog { Filter="JSON (*.json)|*.json", FileName="karte-"+Number("id")+".json" };
            if(d.ShowDialog()!=DialogResult.OK)return;
            File.WriteAllText(d.FileName,card.ToJsonString(Pretty),new UTF8Encoding(false));
            var metaPath=Path.Combine(Path.GetDirectoryName(d.FileName)!,
                Path.GetFileNameWithoutExtension(d.FileName)+".integration.json");
            File.WriteAllText(metaPath,IntegrationMetadata(draft,true).ToJsonString(Pretty),new UTF8Encoding(false));
            status.Text="JSON und Integration gespeichert. Bei einer Übergabe beide Dateien teilen – am besten das ZIP verwenden.";
        } catch(Exception ex){Error(ex);}
    }
    internal static void SelfTest()
    {
        using var editor=new Editor();
        if(editor.fields["id"].Text!="" || !editor.keepAvailability.Checked ||
           editor.changeAvailability.Checked)
            throw new InvalidOperationException("New cards must start without an assigned ID or an automatic unlock");
        editor.changeAvailability.Checked=true;
        editor.boosterUnlock.Checked=true;
        editor.unlockDetails.Text="Im Feuer-Booster nach der dritten Turnierprüfung";
        var uiPlan=editor.CapturePlan();
        if(uiPlan.Availability!="unlock-configured" || !uiPlan.Booster ||
           uiPlan.UnlockDetails.Length==0 || editor.keepAvailability.Checked)
            throw new InvalidOperationException("Simple release UI does not correctly capture explicitly requested unlock");
        editor.keepAvailability.Checked=true;
        if(editor.changeAvailability.Checked)
            throw new InvalidOperationException("Release options must be mutually exclusive");
        editor.NewCard();
        var sample=JsonNode.Parse("{\"id\":42,\"name\":\"Testkarte\",\"level\":2,\"atk\":100,\"def\":80,\"element\":\"FEUER\",\"role\":\"guardian\",\"ability\":\"Test\",\"pveBaseBonus\":{\"atk\":10,\"def\":20},\"future\":{\"value\":1}}")!.AsObject();
        editor.ApplyCard(sample,Path.GetTempPath());
        var image=Path.Combine(Path.GetTempPath(),Guid.NewGuid()+".png");
        var zip=Path.Combine(Path.GetTempPath(),Guid.NewGuid()+".zip");
        try
        {
            using(var bitmap=new Bitmap(40,40)){using var g=Graphics.FromImage(bitmap);g.Clear(Color.CornflowerBlue);bitmap.Save(image,System.Drawing.Imaging.ImageFormat.Png);}
            editor.imageBytes=File.ReadAllBytes(image);editor.imageExtension=".png";editor.preview.SetImage(editor.imageBytes);
            var card=editor.BuildCard();
            if(card["id"]!.GetValue<int>()!=42||card["atk"]!.GetValue<int>()!=100||card["pveBaseBonus"]!["def"]!.GetValue<int>()!=20||card["future"]!["value"]!.GetValue<int>()!=1)throw new InvalidOperationException("Card round-trip failed");
            editor.preview.Size=new Size(400,620);
            using(var rendered=new Bitmap(400,620))editor.preview.DrawToBitmap(rendered,new Rectangle(0,0,400,620));
            WritePackage(zip,card,editor.imageBytes,null,designApproved:true);
            using var archive=ZipFile.OpenRead(zip);
            if(archive.GetEntry("card.json")==null||archive.GetEntry("integration.json")==null||
                archive.GetEntry("manifest.json")==null||archive.GetEntry("VORLAGE_FEHLERBERICHT.md")==null||
                archive.GetEntry(card["art"]!.GetValue<string>())==null||archive.GetEntry("BITTE-LESEN.txt")==null)throw new InvalidOperationException("Package is incomplete");
            using var reader=new StreamReader(archive.GetEntry("card.json")!.Open());
            if(JsonNode.Parse(reader.ReadToEnd())!["name"]!.GetValue<string>()!="Testkarte")throw new InvalidOperationException("Package card data failed");
            using var reopened=new Editor(); reopened.LoadPackage(zip);
            if(reopened.fields["name"].Text!="Testkarte"||reopened.imageBytes==null||reopened.BuildCard()["future"]!["value"]!.GetValue<int>()!=1)throw new InvalidOperationException("Saved package could not be reopened");
            using var popup=new SharePathDialog(zip);
            if(popup.SavedPath!=zip)throw new InvalidOperationException("Sharing dialog path failed");
            if(AssetCatalog.Frames.Count!=20 || AssetCatalog.Levels.Count!=40 || AssetCatalog.Icons.Count<7
                || AssetCatalog.Cards.Count<700)
                throw new InvalidOperationException("Embedded original asset library is incomplete");
            using(var frame=AssetCatalog.SvgBitmap("frame","normal-03",256,408)==null?
                throw new InvalidOperationException("Cannot render original SVG frame"):
                new Bitmap(AssetCatalog.SvgBitmap("frame","normal-03",256,408)!)){}
            if(AssetCatalog.SvgBitmap("level","fusion-lv07",256,408)==null)
                throw new InvalidOperationException("Cannot render level engraving");
            if(AssetCatalog.SvgBitmap("icon","guardian-shield",32,32)==null)
                throw new InvalidOperationException("Cannot render role emblem");
            var originalCard=AssetCatalog.Cards[0];
            editor.ApplyCard(originalCard,Path.GetTempPath());
            var nativeArt=originalCard["art"]!.ToString();
            if(AssetCatalog.ArtworkPreview(nativeArt)==null)
                throw new InvalidOperationException("Original art thumbnail is not bundled");
            SetChoice(editor.frames,"normal-03");
            SetChoice(editor.ornaments,"fusion-lv07");
            SetChoice(editor.icons,"guardian-shield");
            editor.fields["tags"].Text="Schild, Erbe";
            editor.fields["name"].Text="Überarbeiteter Ascheling";
            var edited=editor.BuildCard();
            if(edited["art"]!.ToString()!=nativeArt||
                edited["frameTemplate"]!.ToString()!="normal-03"||
                edited["frameLevelOverlay"]!.ToString()!="fusion-lv07"||
                edited["tags"]!.AsArray().Count!=2)
                throw new InvalidOperationException("Editing an existing card or its layers failed");
            var zip2=Path.Combine(Path.GetTempPath(),Guid.NewGuid()+".zip");
            try
            {
                WritePackage(zip2,edited,null,null,designApproved:true); // Original artwork must NOT be replaced by thumbnail
                using var verify=ZipFile.OpenRead(zip2);
                if(verify.GetEntry(nativeArt)!=null)
                    throw new InvalidOperationException("Unmodified existing artwork incorrectly bundled");
                using var restored=new Editor();
                restored.LoadPackage(zip2);
                if(restored.fields["name"].Text!="Überarbeiteter Ascheling"||
                   ChoiceId(restored.frames)!="normal-03"||
                   ChoiceId(restored.ornaments)!="fusion-lv07")
                    throw new InvalidOperationException("Editing existing card round-trip failed");
            }
            finally {if(File.Exists(zip2))File.Delete(zip2);}

            // The generated browser page must include the game's canonical
            // face() implementation and native embedded SVG frames/trims.
            var gameHtml=GameCardWebPreview.BuildDocument();
            if(!gameHtml.Contains("ArcaneCardView221") ||
               !gameHtml.Contains("ad-level-medallion") ||
               !gameHtml.Contains("data:image/svg+xml;base64,") ||
               !gameHtml.Contains("ad-template-normal-01"))
                throw new InvalidOperationException("Canonical game preview assets not loaded");

            var firstDraft=editor.Snapshot(); // catalog card; original art not copied
            editor.NewCard();
            editor.fields["id"].Text="90042";
            editor.fields["name"].Text="Testkarte";
            editor.imageBytes=File.ReadAllBytes(image);
            editor.imageExtension=".png";
            var secondDraft=editor.Snapshot(); // new card; full image copied
            if(AnalyzeIntent(firstDraft).Count==0)
                throw new InvalidOperationException("Mismatch warning was not detected for manual ornaments");
            if(firstDraft.Integration.Availability!="preserve-existing")
                throw new InvalidOperationException("Existing cards should retain unlock plan by default");
            if(secondDraft.Integration.Availability!="catalog-only")
                throw new InvalidOperationException("New cards must not auto-unlock");
            secondDraft.Integration=new CardIntegrationPlan
            {
                Availability="unlock-configured",Booster=true,
                UnlockDetails="Booster nach Turnierprüfung V freischalten"
            };
            if(IntegrationMetadata(secondDraft,true)["availability"]?.ToString()!="unlock-configured")
                throw new InvalidOperationException("Explicit unlock plan not exported");
            var serialized=JsonSerializer.Serialize(new[]{firstDraft,secondDraft},Pretty);
            var recovered=JsonSerializer.Deserialize<List<CardDraft>>(serialized);
            if(recovered?.Count!=2 || recovered[1].Image==null ||
                recovered[1].Integration.UnlockDetails!=secondDraft.Integration.UnlockDetails ||
               recovered[1].Card["name"]?.ToString()!="Testkarte")
                throw new InvalidOperationException("Persistent draft shelf JSON round-trip failed");
            var zip3=Path.Combine(Path.GetTempPath(),Guid.NewGuid()+".zip");
            try
            {
                bool blockedWithoutConfirmation=false;
                try { WriteShelfPackage(zip3,new[]{firstDraft,secondDraft}); }
                catch(InvalidOperationException ex) when(ex.Message.Contains("bestätigt"))
                {
                    blockedWithoutConfirmation=true;
                }
                if(!blockedWithoutConfirmation)
                    throw new InvalidOperationException("Nonstandard cards were exported without explicit approval");
                WriteShelfPackage(zip3,new[]{firstDraft,secondDraft},true);
                using var batch=ZipFile.OpenRead(zip3);
                if(batch.GetEntry("manifest.json")==null ||
                   batch.GetEntry("CHATGPT_IMPORT.md")==null ||
                    batch.Entries.Count(x=>x.FullName.EndsWith("/integration.json"))!=2 ||
                   batch.Entries.Count(x=>x.FullName.EndsWith("/card.json"))!=2 ||
                   !batch.Entries.Any(x=>x.FullName.EndsWith("assets/custom-art/editor/card-90042.png")))
                    throw new InvalidOperationException("Batch ZIP manifest/cards/artwork incomplete");
                using var summary=new StreamReader(batch.GetEntry("manifest.json")!.Open());
                if(JsonNode.Parse(summary.ReadToEnd())!["cardCount"]!.GetValue<int>()!=2)
                    throw new InvalidOperationException("Batch manifest has wrong card count");
                var artworkEntry=batch.Entries.First(x=>x.FullName.EndsWith("assets/custom-art/editor/card-90042.png"));
                using(var bytes=new MemoryStream())
                {
                    using var src=artworkEntry.Open();
                    src.CopyTo(bytes);
                    if(!bytes.ToArray().SequenceEqual(File.ReadAllBytes(image)))
                        throw new InvalidOperationException("New artwork bytes were altered or compressed incorrectly");
                }
                var firstMeta=batch.Entries.First(x=>x.FullName.StartsWith("cards/000000-")
                     && x.FullName.EndsWith("/integration.json"));
                using(var reader2=new StreamReader(firstMeta.Open()))
                {
                    var meta=JsonNode.Parse(reader2.ReadToEnd())!;
                    if(meta["nonstandardDesignConfirmedByUser"]?.GetValue<bool>()!=true ||
                       meta["visualDefinitionAuthoritative"]?.GetValue<bool>()!=true)
                        throw new InvalidOperationException("Confirmed custom design intent missing");
                }
            }
            finally {if(File.Exists(zip3))File.Delete(zip3);}
        }
        finally { if(File.Exists(image))File.Delete(image);if(File.Exists(zip))File.Delete(zip); }
    }
    static void WritePackage(string path,JsonObject card,byte[]? image,byte[]? customFrame,
        CardIntegrationPlan? plan=null,bool designApproved=false)
    {
        var draft=new CardDraft {Card=(JsonObject)card.DeepClone(),Image=image,Frame=customFrame,
            Integration=plan??new CardIntegrationPlan()};
        ValidateDraft(draft);
        if(AnalyzeIntent(draft).Count>0&&!designApproved)
            throw new InvalidOperationException("Abweichende Karteneigenschaften brauchen eine ausdrückliche Exportbestätigung.");
        using var file=new FileStream(path,FileMode.Create,FileAccess.Write,FileShare.None);
        using var archive=new ZipArchive(file,ZipArchiveMode.Create);
        var json=archive.CreateEntry("card.json");
        using(var writer=new StreamWriter(json.Open(),new UTF8Encoding(false)))writer.Write(card.ToJsonString(Pretty));
        ZipText(archive,"integration.json",IntegrationMetadata(draft,designApproved).ToJsonString(Pretty));
        WriteIntegrationDocuments(archive);
        ZipText(archive,"manifest.json",new JsonObject
        {
            ["format"]="arcane-duel-card-batch-v2",
            ["cardCount"]=1,
            ["cards"]=new JsonArray(new JsonObject
            {
                ["id"]=card["id"]?.DeepClone(), ["name"]=card["name"]?.ToString()??"",
                ["cardJson"]="card.json",["integrationJson"]="integration.json",
                ["artwork"]=card["art"]?.ToString()??"",
                ["artworkBundled"]=image!=null
            })
        }.ToJsonString(Pretty));
        if(image!=null)
        {
            var picture=archive.CreateEntry(card["art"]!.GetValue<string>());
            using var target=picture.Open();target.Write(image,0,image.Length);
        }
        if(customFrame!=null&&card["customFrame"]!=null)
        {
            var frame=archive.CreateEntry(card["customFrame"]!.GetValue<string>());
            using var target=frame.Open();target.Write(customFrame,0,customFrame.Length);
        }
        var info=archive.CreateEntry("BITTE-LESEN.txt");
        using(var w=new StreamWriter(info.Open(),new UTF8Encoding(false)))
            w.Write("Kartenentwurf für Arcane Duel\\n\\nBestehende Bilder behalten ihre Originalpfade und werden nicht durch Thumbnail-Vorschauen ersetzt. Neue Bilder und eigene Rahmen liegen im ZIP. Das Spiel übernimmt Entwürfe nicht automatisch. Karten-IDs, Werte, Rollentags und Fähigkeiten müssen in die maßgeblichen Spielquellen und in den Online-Duo-Katalog übernommen, geprüft und gegebenenfalls veröffentlicht werden. Fähigkeitstext erzeugt keine Spiellogik.\\n");
    }
    void ExportPackage()
    {
        try {
            var draft=Snapshot();
            var card=draft.Card; var art=card["art"]?.ToString();
            if(imageBytes==null&&string.IsNullOrWhiteSpace(art))
                throw new InvalidOperationException("Bitte Artwork auswählen oder vorhandene Karte öffnen.");
            if(!ConfirmIntent(new[]{draft}))return;
            using var d=new SaveFileDialog { Filter="ZIP-Paket (*.zip)|*.zip", FileName="Arcane-Karte-"+Number("id")+".zip" };
            if(d.ShowDialog()!=DialogResult.OK)return;
            WritePackage(d.FileName,card,draft.Image,draft.Frame,draft.Integration,true);
            status.Text="Karte gespeichert. Das Kartenpaket kann im Chat geteilt werden.";
            using var popup=new SharePathDialog(d.FileName); popup.ShowDialog(this);
        }catch(Exception ex){Error(ex);}
    }
    void Error(Exception ex)=>MessageBox.Show(this,ex.Message,"Karten-Editor",MessageBoxButtons.OK,MessageBoxIcon.Warning);
}


internal sealed class SharePathDialog : Form
{
    public string SavedPath { get; }
    public SharePathDialog(string path)
    {
        SavedPath=Path.GetFullPath(path);
        Text="Karte gespeichert"; StartPosition=FormStartPosition.CenterParent;
        ClientSize=new Size(610,280); MinimumSize=new Size(610,280); MaximizeBox=false; MinimizeBox=false;
        BackColor=Color.FromArgb(34,29,43); ForeColor=Color.FromArgb(240,231,218); Font=new Font("Segoe UI",10);
        var title=new Label { Text="DEINE KARTE IST GESPEICHERT", AutoSize=true, ForeColor=Color.FromArgb(225,186,112), Font=new Font("Segoe UI",13,FontStyle.Bold), Location=new Point(22,18) };
        var explanation=new Label { Text="Kopiere den Pfad und füge ihn in die OpenAI-Unterhaltung ein. Der Pfad wird nicht automatisch geteilt.", Location=new Point(24,58), Size=new Size(560,52) };
        var pathBox=new TextBox { Text=SavedPath, ReadOnly=true, Location=new Point(24,112), Width=560, BackColor=Color.FromArgb(48,42,54), ForeColor=Color.White, BorderStyle=BorderStyle.FixedSingle };
        var note=new Label { Text="Zugriff auf den Pfad funktioniert nur, wenn die Unterhaltung auf demselben Computer läuft und Zugriff auf den Ordner hat. Andernfalls das ZIP-Kartenpaket im Chat hochladen.", Location=new Point(24,151), Size=new Size(560,60), ForeColor=Color.FromArgb(195,185,173), Font=new Font("Segoe UI",9) };
        var copy=new Button { Text="Pfad kopieren", Location=new Point(345,226), Size=new Size(135,36), FlatStyle=FlatStyle.Flat, BackColor=Color.FromArgb(195,148,73), ForeColor=Color.FromArgb(29,24,26) };
        copy.FlatAppearance.BorderSize=0; copy.Click+=(_,_)=>{ try { Clipboard.SetText(SavedPath);copy.Text="Kopiert ✓"; } catch(Exception ex){MessageBox.Show(this,ex.Message,"Kopieren fehlgeschlagen",MessageBoxButtons.OK,MessageBoxIcon.Warning);} };
        var close=new Button { Text="Schließen", Location=new Point(489,226), Size=new Size(95,36), FlatStyle=FlatStyle.Flat, BackColor=Color.FromArgb(69,60,74), ForeColor=Color.White, DialogResult=DialogResult.OK }; close.FlatAppearance.BorderSize=0;
        Controls.AddRange(new Control[]{title,explanation,pathBox,note,copy,close}); AcceptButton=close;
    }
}

internal sealed class CardPreview : Control
{
    public string CardName="",Level="",Attack="",Defense="",Element="",Role="",Ability="";
    public string Description="",Tags="",FrameId="auto",LevelDecoration="auto",RoleIcon="auto";
    public bool IsFusion,IsAce,IsEssence;
    public Color Accent=Color.FromArgb(111,77,122);
    Image? art;
    Image? customFrame;
    public CardPreview(){DoubleBuffered=true;BackColor=Color.FromArgb(28,25,36);}

    public void SetImage(byte[]? bytes)
    {
        Image? next=null;
        if(bytes!=null)
        {
            using var input=new MemoryStream(bytes);
            using var source=Image.FromStream(input);
            next=new Bitmap(source);
        }
        var previous=art;art=next;previous?.Dispose();Invalidate();
    }

    public void SetCustomFrame(byte[]? data,string? ext)
    {
        Image? next=null;
        if(data!=null)
        {
            using var input=new MemoryStream(data);
            if(ext==".svg")
            {
                var svg=SvgDocument.Open<SvgDocument>(input);
                next=svg.Draw(720,1140);
            }
            else
            {
                using var source=Image.FromStream(input);
                next=new Bitmap(source);
            }
        }
        var previous=customFrame;customFrame=next;previous?.Dispose();Invalidate();
    }

    protected override void Dispose(bool disposing)
    {
        if(disposing){art?.Dispose();customFrame?.Dispose();}
        base.Dispose(disposing);
    }

    string Family()=>IsAce?"ace":IsEssence?"essence":IsFusion?"fusion":"normal";
    string Frame()
    {
        if(FrameId!="auto" && FrameId!="custom")return FrameId;
        var level=int.TryParse(Level,out var parsed)?Math.Clamp(parsed,1,10):1;
        var tier=level<=2?1:level<=4?2:level<=6?3:level<=8?4:5;
        return Family()+"-"+tier.ToString("00");
    }
    string Ornament()
    {
        if(LevelDecoration=="none")return "";
        if(LevelDecoration!="auto")return LevelDecoration;
        var level=int.TryParse(Level,out var parsed)?Math.Clamp(parsed,1,10):1;
        return Family()+"-lv"+level.ToString("00");
    }
    string Icon()
    {
        if(RoleIcon=="none")return "";
        if(RoleIcon!="auto")return RoleIcon;
        return Role.ToLowerInvariant() switch {
            "guardian"=>"guardian-shield",
            "soul"=>"soul-spiral",
            "predator"=>"predator-skull",
            "combatant" or "allrounder"=>"combatant-swords",
            "weaver"=>"weaver-rune","support"=>"support-star",
            _=>""
        };
    }

    public void DrawPreview(Bitmap target)
    {
        using var graphics=Graphics.FromImage(target);
        PaintCard(graphics,target.Width,target.Height);
    }
    protected override void OnPaint(PaintEventArgs e)
    {
        base.OnPaint(e);
        PaintCard(e.Graphics,Width,Height);
    }
    private void PaintCard(Graphics g,int width,int height)
    {
        g.SmoothingMode=SmoothingMode.AntiAlias;
        g.TextRenderingHint=System.Drawing.Text.TextRenderingHint.AntiAliasGridFit;
        g.Clear(Color.FromArgb(28,25,36));
        float scale=Math.Min((width-16)/360f,(height-16)/570f);
        if(scale<=0)return;
        var state=g.Save();
        g.TranslateTransform((width-360*scale)/2,(height-570*scale)/2);
        g.ScaleTransform(scale,scale);
        try
        {
            using var frame=new SolidBrush(Accent);
            using var page=new SolidBrush(Color.FromArgb(234,219,191));
            using var dark=new SolidBrush(Color.FromArgb(27,30,41));
            using var ink=new SolidBrush(Color.FromArgb(41,31,31));
            using var border=new Pen(Color.FromArgb(218,184,112),4);
            g.FillRectangle(frame,0,0,360,570);
            g.FillRectangle(page,18,18,324,50);
            g.FillRectangle(dark,18,72,324,288);
            g.FillRectangle(page,18,363,324,189);
            if(art!=null)
            {
                float factor=Math.Max(324f/art.Width,288f/art.Height);
                float aw=art.Width*factor,ah=art.Height*factor;
                var stateArt=g.Save();
                g.SetClip(new RectangleF(18,72,324,288));
                g.DrawImage(art,18+(324-aw)/2,72+(288-ah)/2,aw,ah);
                g.Restore(stateArt);
            }
            else
            {
                using var type=new Font("Segoe UI",13,FontStyle.Bold);
                g.DrawString("ARTWORK",type,Brushes.White,new RectangleF(119,199,180,40));
            }

            // Original SVG frame overlays rendered by Svg.NET – never substitutes
            // an approximate GDI rectangle for a selected native game frame.
            var chosen=FrameId=="custom"?null:AssetCatalog.SvgBitmap("frame",Frame(),720,1140);
            if(chosen!=null)g.DrawImage(chosen,0,0,360,570);
            if(FrameId=="custom" && customFrame!=null)g.DrawImage(customFrame,0,0,360,570);
            var decoration=AssetCatalog.SvgBitmap("level",Ornament(),720,1140);
            if(decoration!=null)g.DrawImage(decoration,0,0,360,570);

            using var title=new Font("Segoe UI",15,FontStyle.Bold);
            using var stats=new Font("Segoe UI",16,FontStyle.Bold);
            using var regular=new Font("Segoe UI",10,FontStyle.Regular);
            using var tiny=new Font("Segoe UI",8,FontStyle.Regular);
            g.DrawString(CardName,title,ink,new RectangleF(28,24,310,42));
            var roleText=string.IsNullOrWhiteSpace(Role)?"OHNE ROLLENTAG":Role.ToUpperInvariant();
            var line="LV "+Level+"  ·  "+Element+"  ·  "+roleText;
            g.DrawString(line,regular,ink,new RectangleF(29,373,274,34));
            if(Tags.Length>0)g.DrawString("TAGS: "+Tags,tiny,ink,new RectangleF(28,410,303,27));
            var description=string.IsNullOrWhiteSpace(Description)?Ability:
                Description+(Ability.Length>0?"\n"+Ability:"");
            g.DrawString(description,tiny,ink,new RectangleF(28,442,300,59));
            g.DrawString("ATK "+Attack+"   DEF "+Defense,stats,ink,new RectangleF(27,506,306,43));
            var emblem=AssetCatalog.SvgBitmap("icon",Icon(),72,72);
            if(emblem!=null)
            {
                using var patch=new SolidBrush(Color.FromArgb(202,23,25,39));
                g.FillEllipse(patch,294,372,36,36);
                g.DrawImage(emblem,new RectangleF(298,375,28,28));
            }
        }
        finally {g.Restore(state);}
    }
}
