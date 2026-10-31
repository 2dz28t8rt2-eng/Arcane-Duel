using System.Reflection;
using System.Text;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Svg;

namespace ArcaneCardEditor;

/// <summary>Original in-game frames, level engravings, role emblems and a read-only
/// snapshot of the canonical Solo/Duo monster catalogue, all bundled offline.</summary>
internal static class AssetCatalog
{
    private static readonly Assembly Assembly = typeof(AssetCatalog).Assembly;
    private static readonly Dictionary<string, Bitmap> Renders = new();
    private static readonly Dictionary<string, byte[]> Resources = new();
    public static readonly List<JsonObject> Cards;
    public static readonly List<(string Id, string Label)> Frames;
    public static readonly List<string> Levels;
    public static readonly List<string> Icons;
    private static readonly Dictionary<string, string> Thumbnails;

    static AssetCatalog()
    {
        var cardData = JsonNode.Parse(Encoding.UTF8.GetString(Read("ArcaneCardEditor.Data.Cards")))!.AsObject();
        Cards = cardData["cards"]!.AsArray().Select(n => (JsonObject)n!.DeepClone()).ToList();
        var layout = JsonNode.Parse(Encoding.UTF8.GetString(Read("ArcaneCardEditor.Data.Templates")))!.AsObject();
        Frames = layout["definitions"]!.AsArray().Select(n =>
        {
            var obj = n!.AsObject();
            return (obj["id"]!.ToString(), obj["label"]!.ToString());
        }).ToList();
        Levels = Enumerable.Range(1, 10).SelectMany(n => new[]{"normal", "fusion", "ace", "essence"}
          .Select(k => k + "-lv" + n.ToString("00"))).ToList();
        Icons = new(){"guardian-shield","guardian-sword","soul-spiral","predator-skull",
         "combatant-swords","weaver-rune","support-star","hunter-arrow"};
        Thumbnails = JsonNode.Parse(Encoding.UTF8.GetString(Read("ArcaneCardEditor.Data.Thumbnails")))!
          .AsObject().ToDictionary(x => x.Key, x => x.Value!.ToString());
    }

    private static byte[] Read(string resource)
    {
        if (Resources.TryGetValue(resource, out var cached)) return cached;
        using var stream = Assembly.GetManifestResourceStream(resource)
           ?? throw new InvalidOperationException("Fehlendes Editor-Asset: " + resource);
        using var buffer = new MemoryStream();
        stream.CopyTo(buffer);
        return Resources[resource] = buffer.ToArray();
    }


    private static string? gameCss;
    private static readonly string[] NativeCardCss =
    {
        "card-look-v3.css", "card-preview-polish-v4.css",
        "card-templates-v1.css", "card-level-frames-v401.css",
        "card-level-runtime-v402.css", "card-shell-v404.css",
        "card-v405-polish.css"
    };

    public static string GameCardScript() =>
        Encoding.UTF8.GetString(Read("ArcaneCardEditor.Script.CardView221"));

    public static string GameCardStyles()
    {
        if (gameCss != null) return gameCss;
        var css = string.Join(Environment.NewLine,
            NativeCardCss.Select(file => Encoding.UTF8.GetString(Read("ArcaneCardEditor.Style." + file))));
        // Same original SVG files as the game. Embed as data: instead of
        // filesystem paths, because WebView2 NavigateToString has no asset root.
        gameCss = Regex.Replace(css,
            @"url\(\s*[""']?card-templates/(levels/)?([a-z0-9-]+)\.svg[""']?\s*\)",
            match =>
            {
                var type = match.Groups[1].Success ? "Level" : "Frame";
                var id = match.Groups[2].Value;
                var bytes = Read("ArcaneCardEditor." + type + "." + id + ".svg");
                return "url(\"data:image/svg+xml;base64," + Convert.ToBase64String(bytes) + "\")";
            }, RegexOptions.IgnoreCase);
        return gameCss;
    }

    public static string IconDataUri(string icon)
    {
        if (!Icons.Contains(icon)) return "";
        return "data:image/svg+xml;base64," +
            Convert.ToBase64String(Read("ArcaneCardEditor.Icon." + icon + ".svg"));
    }

    public static byte[]? ArtworkPreview(string? path)
    {
        if (string.IsNullOrWhiteSpace(path) || !Thumbnails.TryGetValue(path, out var key)) return null;
        return Read("ArcaneCardEditor.Thumb." + key + ".jpg");
    }

    public static Bitmap? SvgBitmap(string type, string id, int width, int height)
    {
        if (string.IsNullOrWhiteSpace(id) || id == "Ohne") return null;
        var key = type + ":" + id + ":" + width + "x" + height;
        if (Renders.TryGetValue(key, out var bitmap)) return bitmap;
        try
        {
            var src = type switch { "frame" => "ArcaneCardEditor.Frame.",
              "level" => "ArcaneCardEditor.Level.", "icon" => "ArcaneCardEditor.Icon.",
              _ => throw new ArgumentException("Unknown asset family", nameof(type)) };
            using var ms = new MemoryStream(Read(src + id + ".svg"));
            var svg = SvgDocument.Open<SvgDocument>(ms);
            bitmap = svg.Draw(width, height);
            Renders[key] = bitmap;
            return bitmap;
        }
        catch (Exception) { return null; }
    }
}

/// <summary>Fast searchable picker for an existing card, or the art from one.</summary>
internal sealed class CardPicker : Form
{
    private sealed record Choice(JsonObject Card)
    {
        public override string ToString()
        {
            var id = Card["id"]?.ToString() ?? "?";
            var name = Card["name"]?.ToString() ?? "Karte";
            return "#" + id.PadLeft(3) + " · LV " + Card["level"] + " · " + name
              + "  [" + (Card["role"]?.ToString() ?? "-") + "]";
        }
    }
    private readonly TextBox search = new() { Dock = DockStyle.Top, PlaceholderText = "ID, Name, Rolle oder Element suchen …" };
    private readonly ListBox cards = new() { Dock = DockStyle.Fill, IntegralHeight = false, Font = new Font("Segoe UI", 10) };
    private readonly PictureBox portrait = new() { SizeMode = PictureBoxSizeMode.Zoom, Dock = DockStyle.Fill };
    private readonly Label description = new() { Dock = DockStyle.Top, Height = 90 };

    readonly ComboBox roleFilter = FilterCombo(130);
    readonly ComboBox elementFilter = FilterCombo(112);
    readonly ComboBox levelFilter = FilterCombo(95);
    readonly ComboBox typeFilter = FilterCombo(118);
    readonly ComboBox rarityFilter = FilterCombo(105);
    readonly ComboBox sortFilter = FilterCombo(135);
    readonly Label hitCount = new() { AutoSize = true, ForeColor = Color.FromArgb(215,184,132) };
    public JsonObject? SelectedCard { get; private set; }
    static ComboBox FilterCombo(int width) => new()
    {
        DropDownStyle = ComboBoxStyle.DropDownList,
        Width = width, Height = 26, BackColor = Color.FromArgb(55,47,66),
        ForeColor = Color.White, FlatStyle = FlatStyle.Flat,
        Font = new Font("Segoe UI",9)
    };
    static string Value(JsonObject card,string key) => card[key]?.ToString() ?? "";
    static string Type(JsonObject c) => Value(c,"ace").Equals("true",StringComparison.OrdinalIgnoreCase)?"ACE":
        Value(c,"essenceMonster").Equals("true",StringComparison.OrdinalIgnoreCase)?"Essenz":
        Value(c,"fusionOnly").Equals("true",StringComparison.OrdinalIgnoreCase)?"Fusion":"Standard";
    static void Populate(ComboBox combo,string title,IEnumerable<string> values)
    {
        combo.Items.Add(title);
        foreach(var value in values.Where(x => !string.IsNullOrWhiteSpace(x)).Distinct(StringComparer.OrdinalIgnoreCase)
                     .OrderBy(x => x,StringComparer.CurrentCultureIgnoreCase))combo.Items.Add(value);
        combo.SelectedIndex=0;
    }

    public CardPicker(bool pickArt = false)
    {
        Text = pickArt ? "Original-Artwork aus dem Katalog wählen" : "Bestehende Spielkarte bearbeiten";
        Width = 930; Height = 650; MinimumSize = new Size(720, 480);
        Font = new Font("Segoe UI", 10); BackColor = Color.FromArgb(30,26,39);
        ForeColor = Color.FromArgb(238,227,206); StartPosition = FormStartPosition.CenterParent;
        var root = new TableLayoutPanel { Dock=DockStyle.Fill, ColumnCount=2, RowCount=2 };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 61));
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 39));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 90)); root.RowStyles.Add(new RowStyle(SizeType.Percent, 10));
        var left = new Panel { Dock=DockStyle.Fill, Padding=new Padding(12) };
        search.BackColor=Color.FromArgb(55,47,66); search.ForeColor=Color.White;
        cards.BackColor=Color.FromArgb(40,34,51); cards.ForeColor=Color.White;

        var filters = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 94, WrapContents = true, AutoScroll = true };
        Populate(roleFilter,"Alle Rollen",AssetCatalog.Cards.Select(c=>Value(c,"role")));
        Populate(elementFilter,"Alle Elemente",AssetCatalog.Cards.Select(c=>Value(c,"element")));
        Populate(levelFilter,"Alle Stufen",AssetCatalog.Cards.Select(c=>Value(c,"level")));
        Populate(typeFilter,"Alle Typen",new[]{"Standard","Fusion","ACE","Essenz"});
        Populate(rarityFilter,"Alle Seltenheiten",AssetCatalog.Cards.Select(c=>Value(c,"rarity")));
        Populate(sortFilter,"Sortierung",new[]{"Name A–Z","Stufe aufsteigend","Stufe absteigend","ID aufsteigend"});
        foreach(var combo in new[]{roleFilter,elementFilter,levelFilter,typeFilter,rarityFilter,sortFilter})
        {
            combo.SelectedIndexChanged+=(_,_)=>RefreshCards();
            filters.Controls.Add(combo);
        }
        left.Controls.Add(cards);
        left.Controls.Add(filters);
        left.Controls.Add(search);
        search.PlaceholderText="ID, Name, Rolle oder Element suchen …";
        var right = new Panel { Dock=DockStyle.Fill, Padding=new Padding(12) };
        right.Controls.Add(portrait);right.Controls.Add(description);
        var buttons = new FlowLayoutPanel { Dock=DockStyle.Fill, FlowDirection=FlowDirection.RightToLeft };
        var ok=new Button { Text=pickArt?"Artwork übernehmen":"Karte bearbeiten", Width=185, Height=36,
          DialogResult=DialogResult.OK };
        var cancel=new Button { Text="Abbrechen", Width=110, Height=36, DialogResult=DialogResult.Cancel };
        buttons.Controls.Add(ok);buttons.Controls.Add(cancel);
        root.Controls.Add(left,0,0);root.Controls.Add(right,1,0);
        root.Controls.Add(buttons,0,1);root.SetColumnSpan(buttons,2);Controls.Add(root);
        AcceptButton=ok;CancelButton=cancel;
        search.TextChanged+=(_,_)=>RefreshCards();
        cards.SelectedIndexChanged+=(_,_)=>ShowSelection();
        cards.DoubleClick+=(_,_)=>{if(cards.SelectedItem!=null)DialogResult=DialogResult.OK;};
        RefreshCards();
        TextChanged+=(_,_)=>{};
        FormClosing+=(_,e)=>{
            if(DialogResult==DialogResult.OK && cards.SelectedItem is Choice c)
               SelectedCard=(JsonObject)c.Card.DeepClone();
            else SelectedCard=null;
        };
    }

    private void RefreshCards()
    {
        var query=search.Text.Trim();
        var selectedId=(cards.SelectedItem as Choice)?.Card["id"]?.ToString();
        string selected(ComboBox combo)=>combo.SelectedIndex>0?combo.SelectedItem?.ToString()??"":"";
        var role=selected(roleFilter);var element=selected(elementFilter);
        var level=selected(levelFilter);var type=selected(typeFilter);
        var rarity=selected(rarityFilter);
        IEnumerable<JsonObject> found=AssetCatalog.Cards.Where(c=>
           (string.IsNullOrEmpty(query) || Value(c,"id").Contains(query,StringComparison.OrdinalIgnoreCase)
            || Value(c,"name").Contains(query,StringComparison.OrdinalIgnoreCase)
            || Value(c,"role").Contains(query,StringComparison.OrdinalIgnoreCase)
            || Value(c,"element").Contains(query,StringComparison.OrdinalIgnoreCase))
           &&(role.Length==0||Value(c,"role").Equals(role,StringComparison.OrdinalIgnoreCase))
           &&(element.Length==0||Value(c,"element").Equals(element,StringComparison.OrdinalIgnoreCase))
           &&(level.Length==0||Value(c,"level")==level)
           &&(type.Length==0||Type(c)==type)
           &&(rarity.Length==0||Value(c,"rarity").Equals(rarity,StringComparison.OrdinalIgnoreCase)));
        found=sortFilter.SelectedItem?.ToString() switch
        {
            "Name A–Z"=>found.OrderBy(c=>Value(c,"name"),StringComparer.CurrentCultureIgnoreCase),
            "Stufe aufsteigend"=>found.OrderBy(c=>int.TryParse(Value(c,"level"),out var n)?n:0).ThenBy(c=>Value(c,"name")),
            "Stufe absteigend"=>found.OrderByDescending(c=>int.TryParse(Value(c,"level"),out var n)?n:0).ThenBy(c=>Value(c,"name")),
            _=>found.OrderBy(c=>int.TryParse(Value(c,"id"),out var n)?n:0)
        };
        cards.BeginUpdate();cards.Items.Clear();
        foreach(var card in found)cards.Items.Add(new Choice(card));
        cards.EndUpdate();
        var selectedIndex=Enumerable.Range(0,cards.Items.Count).FirstOrDefault(i=>
            (cards.Items[i] as Choice)?.Card["id"]?.ToString()==selectedId,-1);
        if(cards.Items.Count>0)cards.SelectedIndex=selectedIndex>=0?selectedIndex:0;
        else {description.Text="Keine Karte entspricht den Filtern.";var old=portrait.Image;portrait.Image=null;old?.Dispose();}
        hitCount.Text=cards.Items.Count+" Karten";
        if(!leftHitLabelAdded) {leftHitLabelAdded=true;}
    }
    bool leftHitLabelAdded;

    private void ShowSelection()
    {
        if(cards.SelectedItem is not Choice choice)return;
        var card=choice.Card;
        description.Text=(card["name"]?.ToString()??"") + Environment.NewLine
          +"ATK "+card["atk"]+" · DEF "+card["def"] + Environment.NewLine
          +(card["desc"]?.ToString()??"");
        var bytes=AssetCatalog.ArtworkPreview(card["art"]?.ToString());
        var old=portrait.Image;portrait.Image=null;
        if(bytes!=null)
        {
            using var ms=new MemoryStream(bytes);
            using var img=Image.FromStream(ms);
            portrait.Image=new Bitmap(img);
        }
        old?.Dispose();
    }
    protected override void Dispose(bool disposing)
    {
        if(disposing)portrait.Image?.Dispose();
        base.Dispose(disposing);
    }
}
