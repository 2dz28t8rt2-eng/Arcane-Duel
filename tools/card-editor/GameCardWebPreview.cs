using System.Text;
using System.Text.Json;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace ArcaneCardEditor;

/// <summary>
/// Renders cards with the actual Arcane Duel card-view-v221 HTML and original
/// card CSS/SVG resources. The legacy GDI preview is only an offline fallback.
/// </summary>
internal sealed class GameCardWebPreview : UserControl
{
    readonly WebView2 browser = new() { Dock = DockStyle.Fill, Visible = true };
    string pendingJson = "{}";
    bool initialized, ready;
    readonly System.Windows.Forms.Timer redrawTimer = new() { Interval = 90 };
    public bool IsReady => ready;

    public GameCardWebPreview()
    {
        Dock = DockStyle.Fill;
        BackColor = Color.FromArgb(24, 21, 33);
        Controls.Add(browser);
        redrawTimer.Tick += (_, _) => { redrawTimer.Stop(); SendLatest(); };
        // The host must remain visible to create its native handle for WebView2.
        HandleCreated += (_, _) => _ = InitializeBrowser();
    }

    async Task InitializeBrowser()
    {
        if (initialized || DesignMode) return;
        initialized = true;
        try
        {
            var folder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "ArcaneDuel", "CardEditor", "WebView2");
            Directory.CreateDirectory(folder);
            var environment = await CoreWebView2Environment.CreateAsync(null, folder);
            if (IsDisposed) return;
            await browser.EnsureCoreWebView2Async(environment);
            browser.CoreWebView2.Settings.AreDevToolsEnabled = false;
            browser.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            browser.CoreWebView2.Settings.IsWebMessageEnabled = false;
            browser.CoreWebView2.Settings.IsStatusBarEnabled = false;
            browser.NavigationCompleted += (_, e) =>
            {
                if (!e.IsSuccess) return;
                ready = true;
                browser.Visible = true;
                Visible = true;
                SendLatest();
            };
            browser.NavigateToString(BuildDocument());
        }
        catch (Exception ex)
        {
            // Keep the existing fallback rather than breaking the editor
            // when WebView2 Runtime is unavailable or blocked by policy.
            ready = false;
            browser.Visible = false;
            Visible = false; // reveal the WinForms fallback only on failure
            System.Diagnostics.Debug.WriteLine("WebView2 card preview unavailable: " + ex);
        }
    }

    public void UpdateCard(object model)
    {
        pendingJson = JsonSerializer.Serialize(model);
        if (ready) { redrawTimer.Stop(); redrawTimer.Start(); }
    }

    async void SendLatest()
    {
        if (!ready || IsDisposed || browser.CoreWebView2 == null) return;
        try { await browser.ExecuteScriptAsync("window.renderArcaneEditorCard(" + pendingJson + ")"); }
        catch (Exception ex) { System.Diagnostics.Debug.WriteLine(ex); }
    }

    public async Task<bool> SavePngAsync(string path)
    {
        if (!ready || browser.CoreWebView2 == null) return false;
        redrawTimer.Stop();
        await browser.ExecuteScriptAsync("window.renderArcaneEditorCard(" + pendingJson + ")");
        await Task.Delay(110); // allow the browser to complete its render before capture
        var bounds=await browser.ExecuteScriptAsync(
            "(()=>{const e=document.querySelector('#arcaneEditorMount .hand-card');" +
            "if(!e)return null;const r=e.getBoundingClientRect();" +
            "return {x:r.x,y:r.y,w:r.width,h:r.height};})()");
        using var capture=new MemoryStream();
        await browser.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png,capture);
        capture.Position=0;
        using var screen=Image.FromStream(capture);
        using var location=JsonDocument.Parse(bounds);
        if(location.RootElement.ValueKind!=JsonValueKind.Object)
            throw new InvalidOperationException("Keine sichtbare Karte für PNG-Export gefunden.");
        var rect=location.RootElement;
        var xScale=(double)screen.Width/Math.Max(1,browser.ClientSize.Width);
        var yScale=(double)screen.Height/Math.Max(1,browser.ClientSize.Height);
        var x=Math.Clamp((int)Math.Round(rect.GetProperty("x").GetDouble()*xScale),0,screen.Width-1);
        var y=Math.Clamp((int)Math.Round(rect.GetProperty("y").GetDouble()*yScale),0,screen.Height-1);
        var width=Math.Clamp((int)Math.Round(rect.GetProperty("w").GetDouble()*xScale),1,screen.Width-x);
        var height=Math.Clamp((int)Math.Round(rect.GetProperty("h").GetDouble()*yScale),1,screen.Height-y);
        using var card=new Bitmap(width,height);
        using(var graphics=Graphics.FromImage(card))
            graphics.DrawImage(screen,new Rectangle(0,0,width,height),
                new Rectangle(x,y,width,height),GraphicsUnit.Pixel);
        card.Save(path,System.Drawing.Imaging.ImageFormat.Png);
        return true;
    }

    protected override void Dispose(bool disposing)
    {
        if(disposing)redrawTimer.Dispose();
        base.Dispose(disposing);
    }

    internal static string BuildDocument()
    {
        // Actual game CSS files and the canonical shared HTML card renderer.
        // Frame/ornament URLs in those styles are replaced with embedded SVG
        // data URIs so the single-file executable works entirely offline.
        var styles = AssetCatalog.GameCardStyles();
        var script = AssetCatalog.GameCardScript();
        return "<!doctype html><html lang=\"de\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
            + "<style>" + styles + "</style><style>"
            + "html,body{padding:0!important;margin:0!important;background:#181521!important;min-height:100%;}"
            + "body{display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;}"
            + "body>#deckSidePreview.ad-deck-portal{display:flex!important;position:static!important;flex-direction:column!important;"
            + "align-items:center!important;width:100%!important;max-width:100%!important;min-height:100vh!important;height:auto!important;"
            + "border:0!important;padding:12px 8px!important;margin:0!important;overflow:visible!important;"
            + "background:transparent!important;box-shadow:none!important;box-sizing:border-box!important;}"
            + "#deckSidePreview .deck-preview-card{flex:0 0 auto!important;margin:0 auto!important;padding:0!important;max-width:100%!important;}"
            + "button.hand-card.tc-card,div.hand-card.tc-card{position:relative;display:flex!important;flex-direction:column!important;"
            + "text-align:left;appearance:none;cursor:default!important;box-sizing:border-box!important;"
            + "width:min(286px,90vw)!important;max-width:286px!important;height:408px!important;min-height:408px!important;"
            + "flex:0 0 auto!important;transform:none!important;transition:none!important;}"
            + "body #deckSidePreview .hand-card.tc-card:hover:not(:disabled){transform:none!important;filter:none!important;}"
            + ".hand-card.tc-card .hand-art{min-height:0!important;flex:1 1 auto!important;}"
            + ".hand-card.tc-card .hand-art img{width:100%;height:100%;object-fit:cover;}"
            + ".hand-card.tc-card .hand-stats{flex:0 0 44px!important;height:44px!important;}"
            + "#arcaneEditorMeta{margin:12px 0 0;text-align:center;color:#dfc99e;font:12px/1.4 Segoe UI,sans-serif;"
            + "max-width:310px;overflow-wrap:anywhere;}"
            + "#arcaneEditorMeta img{width:16px;height:16px;vertical-align:middle;margin-right:5px;}"
            + "@media(max-height:510px){body>#deckSidePreview.ad-deck-portal{justify-content:flex-start!important;}"
            + "button.hand-card.tc-card,div.hand-card.tc-card{height:370px!important;min-height:370px!important;}}"
            + "@media(max-width:340px){button.hand-card.tc-card,div.hand-card.tc-card{width:94vw!important;height:390px!important;min-height:390px!important;}}"
            + "</style></head><body><div id=\"deckSidePreview\" class=\"ad-deck-portal\">"
            + "<div class=\"deck-preview-card\" id=\"arcaneEditorMount\"></div>"
            + "<div id=\"arcaneEditorMeta\" aria-live=\"polite\"></div></div>"
            + "<script>" + script + "</script><script>"
            + Script
            + "</script></body></html>";
    }

    // Use the game's actual face() and frame() functions; do not manually
    // reposition the stats, level seal, image, title or element.
    const string Script = """
    'use strict';
    window.renderArcaneEditorCard = function(m) {
      const game = window.ArcaneCardView221;
      if (!game) return;
      const safeKey = value => /^[a-z0-9-]+$/.test(value || '') ? value : '';
      const family = m.ace ? 'ace' : m.essenceMonster ? 'essence' : m.fusionOnly ? 'fusion' : 'normal';
      const lv = Math.max(1, Math.min(10, Math.trunc(Number(m.level)||1)));
      const tier = Math.min(5, Math.ceil(lv / 2));
      const card = {
        id: Math.max(0, Number(m.id)||0),
        name: String(m.name||'Neue Karte'),
        level: lv, atk: Number(m.atk)||0, def: Number(m.def)||0,
        role: String(m.role||'combatant'), element: String(m.element||'FEUER').toUpperCase(),
        art: String(m.art||''), ace: !!m.ace, essenceMonster: !!m.essenceMonster,
        fusionOnly: !!m.fusionOnly
      };
      const mount = document.getElementById('arcaneEditorMount');
      const html = game.face(card, {frame:game.frame(card), tag:'div'});
      mount.innerHTML = html;
      const el = mount.firstElementChild;
      if (!el) return;
      const chosenFrame = safeKey(m.frameTemplate);
      let visualFamily = family;
      if (chosenFrame && chosenFrame !== 'auto' && chosenFrame !== 'custom') {
        const parts = chosenFrame.match(/^(normal|fusion|ace|essence)-0([1-5])$/);
        if(parts) {
          visualFamily = parts[1];
          el.classList.remove('ad-template-family-' + family,'ad-template-tier-' + tier);
          el.classList.forEach(k => {if(k.startsWith('ad-template-') && /-(0[1-5])$/.test(k)) el.classList.remove(k);});
          el.classList.add('ad-template-family-' + visualFamily);
          el.classList.add('ad-template-tier-' + Number(parts[2]));
          el.classList.add('ad-template-' + chosenFrame);
          if (!m.frameLevelOverlay || m.frameLevelOverlay==='auto') {
            el.classList.remove('ad-level-'+family+'-'+String(lv).padStart(2,'0'));
            el.classList.add('ad-level-'+visualFamily+'-'+String(lv).padStart(2,'0'));
          }
        }
      }
      if (m.frameUrl && m.frameTemplate === 'custom') {
        el.style.setProperty('--ad-tpl-frame', 'url("' + m.frameUrl + '")', 'important');
      }
      if(m.customAccent && /^#[0-9a-f]{6}$/i.test(m.accent || '')){
        el.style.setProperty('--ad-tpl-rim',m.accent,'important');
      }
      const customTrim = safeKey(m.frameLevelOverlay);
      if(customTrim === 'none')el.style.setProperty('--ad-level-trim','none','important');
      else if(customTrim && customTrim !== 'auto') {
        const t=customTrim.match(/^(normal|fusion|ace|essence)-lv(0[1-9]|10)$/);
        if(t) {
          const old='ad-level-'+family+'-'+String(lv).padStart(2,'0');
          el.classList.remove(old);
          el.classList.add('ad-level-'+t[1]+'-'+t[2]);
        }
      }
      const labels = {guardian:'Wächter',defender:'Verteidiger',soul:'Seelenzehrer',
        predator:'Predator',combatant:'Allrounder',allrounder:'Allrounder',
        resonator:'Resonator',weaver:'Runenweber',hunter:'Jäger',support:'Unterstützer'};
      const meta=document.getElementById('arcaneEditorMeta');
      meta.replaceChildren();
      const label=document.createElement('span');
      label.textContent=(labels[card.role]||card.role)+' · '+card.element
        +(m.description?' · '+m.description:'')
        +(m.ability?' · Fähigkeit: '+m.ability:'')
        +(m.tags?' · Tags: '+m.tags:'');
      if (m.iconUrl && m.frameRoleIcon !== 'none'){
        const img=document.createElement('img');img.alt='Rollensymbol';img.src=m.iconUrl;meta.appendChild(img);
      }
      meta.appendChild(label);
    };
    """;
}
