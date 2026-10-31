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
    public JsonObject? SelectedCard { get; private set; }

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
        left.Controls.Add(cards);left.Controls.Add(search);
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
        FormClosing+=(_,e)=>{
            if(DialogResult==DialogResult.OK && cards.SelectedItem is Choice c)
               SelectedCard=(JsonObject)c.Card.DeepClone();
            else SelectedCard=null;
        };
    }

    private void RefreshCards()
    {
        var query=search.Text.Trim();
        var found=AssetCatalog.Cards.Where(c=>
           string.IsNullOrEmpty(query) || (c["id"]?.ToString()??"").Contains(query,StringComparison.OrdinalIgnoreCase)
            || (c["name"]?.ToString()??"").Contains(query,StringComparison.OrdinalIgnoreCase)
            || (c["role"]?.ToString()??"").Contains(query,StringComparison.OrdinalIgnoreCase)
            || (c["element"]?.ToString()??"").Contains(query,StringComparison.OrdinalIgnoreCase)).ToList();
        cards.BeginUpdate();cards.Items.Clear();
        foreach(var card in found)cards.Items.Add(new Choice(card));
        cards.EndUpdate();
        if(cards.Items.Count>0)cards.SelectedIndex=0;
    }
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
