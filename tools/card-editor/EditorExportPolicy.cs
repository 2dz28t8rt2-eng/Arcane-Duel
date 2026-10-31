using System.Text;
using System.Text.Json.Nodes;

namespace ArcaneCardEditor;

/// <summary>
/// Export intent belongs to the editing workflow, not the game's executable
/// card record. Per-card integration.json preserves the user's decisions.
/// </summary>
internal sealed partial class Editor
{
    private sealed class CardIntegrationPlan
    {
        public CardIntegrationPlan() { } // Required for durable JSON round-trips.
        public string Availability { get; set; } = "catalog-only";
        public bool Booster { get; set; }
        public bool StarterDeck { get; set; }
        public bool QuestReward { get; set; }
        public string UnlockDetails { get; set; } = "";
    }

    readonly ComboBox availabilityPicker=new()
    {
        Width=530, DropDownStyle=ComboBoxStyle.DropDownList,
        BackColor=Color.FromArgb(50,42,60), ForeColor=Color.FromArgb(238,229,207)
    };
    readonly CheckBox boosterUnlock=new() {Text="Booster / Kartenpakete",AutoSize=true};
    readonly CheckBox starterUnlock=new() {Text="Startsammlung / Deck",AutoSize=true};
    readonly CheckBox questUnlock=new() {Text="Quest-, Turnier- oder Gegnerbelohnung",AutoSize=true};
    readonly TextBox unlockDetails=new()
    {
        Width=530,Height=88,Multiline=true,ScrollBars=ScrollBars.Vertical,
        BackColor=Color.FromArgb(48,42,54),ForeColor=Color.White,
        PlaceholderText="Wo, wann und für wen genau freischalten? Keine stillschweigenden Annahmen."
    };
    readonly Label integrationHint=new()
    {
        AutoSize=true,MaximumSize=new Size(530,0),ForeColor=Color.FromArgb(215,184,132)
    };

    void SetupIntegrationControls(FlowLayoutPanel stack)
    {
        AddTitle(stack,"Freischaltung & Integration");
        stack.Controls.Add(new Label {AutoSize=true,MaximumSize=new Size(530,0),
            Text="Karte im Katalog erstellen/ändern ist NICHT automatisch eine Freischaltung. "+
                 "Die folgende Einstellung gilt nur für den späteren ChatGPT-Import."});
        availabilityPicker.Items.AddRange(new object[]
        {
            "Nur Katalog – keine Freischaltungen verändern",
            "Bestehende Freischaltungen unverändert lassen",
            "Freischaltung ausdrücklich anfordern"
        });
        availabilityPicker.SelectedIndexChanged+=(_,_)=>UpdateUnlockUi();
        stack.Controls.Add(integrationHint);
        AddFieldLabel(stack,"Gewünschte Integration");
        stack.Controls.Add(availabilityPicker);
        foreach(var box in new[]{boosterUnlock,starterUnlock,questUnlock})
        {
            box.Margin=new Padding(12,5,2,5);stack.Controls.Add(box);
        }
        AddFieldLabel(stack,"Freischaltbedingungen / präzise Anweisung");
        stack.Controls.Add(unlockDetails);
        fields["id"].TextChanged+=(_,_)=>UpdateIntegrationHint();
        availabilityPicker.SelectedIndex=0;
        UpdateIntegrationHint();
    }

    bool IsKnownCard(JsonObject card)
    {
        var id=card["id"]?.ToString();
        return AssetCatalog.Cards.Any(c=>c["id"]?.ToString()==id);
    }

    void ResetIntegrationForCard(JsonObject? card=null)
    {
        availabilityPicker.SelectedIndex=card!=null&&IsKnownCard(card)?1:0;
        boosterUnlock.Checked=starterUnlock.Checked=questUnlock.Checked=false;
        unlockDetails.Text="";
        UpdateUnlockUi();
    }

    void UpdateIntegrationHint()
    {
        if(!fields.TryGetValue("id",out var id))return;
        var known=AssetCatalog.Cards.Any(c=>c["id"]?.ToString()==id.Text.Trim());
        integrationHint.Text=known
            ?"ID "+id.Text+": bereits im eingebetteten Spielkatalog – Werteänderung statt neuer Karte."
            :"ID "+id.Text+": im eingebetteten Katalog nicht gefunden – neue Karte bzw. ID im Live-Projekt prüfen.";
    }

    void UpdateUnlockUi()
    {
        var requested=availabilityPicker.SelectedIndex==2;
        foreach(var checkbox in new[]{boosterUnlock,starterUnlock,questUnlock})
            checkbox.Enabled=requested;
        unlockDetails.Enabled=requested;
        UpdateIntegrationHint();
    }

    CardIntegrationPlan CapturePlan()=>new()
    {
        Availability=availabilityPicker.SelectedIndex switch
        {
            1=>"preserve-existing",2=>"unlock-configured",_=>"catalog-only"
        },
        Booster=boosterUnlock.Checked,StarterDeck=starterUnlock.Checked,
        QuestReward=questUnlock.Checked,UnlockDetails=unlockDetails.Text.Trim()
    };

    void ApplyPlan(CardIntegrationPlan? plan)
    {
        plan??=new CardIntegrationPlan();
        availabilityPicker.SelectedIndex=plan.Availability switch
        {
            "preserve-existing"=>1,"unlock-configured"=>2,_=>0
        };
        boosterUnlock.Checked=plan.Booster;
        starterUnlock.Checked=plan.StarterDeck;
        questUnlock.Checked=plan.QuestReward;
        unlockDetails.Text=plan.UnlockDetails??"";
        UpdateUnlockUi();
    }

    static void ValidateDraft(CardDraft draft)
    {
        var plan=draft.Integration??new CardIntegrationPlan();
        if(plan.Availability=="unlock-configured")
        {
            if(!plan.Booster&&!plan.StarterDeck&&!plan.QuestReward)
                throw new InvalidOperationException("Karte "+draft.Card["id"]+
                    ": Freischaltung angefordert, aber kein Ziel ausgewählt.");
            if(string.IsNullOrWhiteSpace(plan.UnlockDetails))
                throw new InvalidOperationException("Karte "+draft.Card["id"]+
                    ": Bitte die konkrete Freischaltbedingung angeben.");
        }
        if(draft.Image is { Length: > 32_000_000 })
            throw new InvalidOperationException("Karte "+draft.Card["id"]+": Artwork größer als 32 MB.");
        if(draft.Frame is { Length: > 2_000_000 })
            throw new InvalidOperationException("Karte "+draft.Card["id"]+": Rahmen größer als 2 MB.");
        var art=RelativeAsset(draft.Card,"art");
        if(draft.Image==null && art.StartsWith("assets/custom-art/editor/",StringComparison.Ordinal)
            && AssetCatalog.ArtworkPreview(art)==null)
            throw new InvalidOperationException("Karte "+draft.Card["id"]+
                ": Neues Editor-Artwork fehlt. Bitte Bild erneut auswählen, damit die Originaldatei im ZIP liegt.");
        if(draft.Image!=null &&
           (art.Length==0||!new[]{".png",".jpg",".jpeg",".bmp",".gif",".webp"}
               .Contains(Path.GetExtension(art),StringComparer.OrdinalIgnoreCase)))
            throw new InvalidOperationException("Karte "+draft.Card["id"]+
                ": Neues Artwork muss mit gültigem assets/-Zielpfad und Dateityp im ZIP liegen.");
        if(draft.Frame!=null && RelativeAsset(draft.Card,"customFrame").Length==0)
            throw new InvalidOperationException("Karte "+draft.Card["id"]+
                ": Eigener Rahmen benötigt gültigen assets/-Zielpfad.");
    }

    static List<string> AnalyzeIntent(CardDraft draft)
    {
        var c=draft.Card;
        string field(string name)=>c[name]?.ToString()??"";
        bool flag(string name)=>string.Equals(field(name),"true",StringComparison.OrdinalIgnoreCase);
        var issues=new List<string>();
        var existing=AssetCatalog.Cards.FirstOrDefault(x=>x["id"]?.ToString()==field("id"));
        if(existing!=null && !string.Equals(existing["name"]?.ToString(),field("name"),
            StringComparison.OrdinalIgnoreCase))
            issues.Add("ID "+field("id")+" ist bereits der Karte '"+existing["name"]+
                       "' zugeordnet. Ein Import aktualisiert diese ID statt eine neue Karte anzulegen.");
        int.TryParse(field("level"),out var level);
        var family=flag("ace")?"ace":flag("essenceMonster")?"essence":
            flag("fusionOnly")?"fusion":"normal";
        var typeFlags=new[]{"ace","essenceMonster","fusionOnly"}.Count(flag);
        if(typeFlags>1)
            issues.Add("Mehrere Kartentypen gleichzeitig aktiv (ACE/Essenz/Fusion).");
        if(level>10)
            issues.Add("Stufe "+level+" liegt über dem üblichen Kartenbereich 1–10; Vorschau begrenzt auf 10.");
        var frame=field("frameTemplate");
        if(frame is not ("" or "auto" or "custom") &&
           !frame.StartsWith(family+"-",StringComparison.OrdinalIgnoreCase))
            issues.Add("Manueller Rahmen '"+frame+"' weicht vom Kartentyp '"+family+"' ab.");
        var ornament=field("frameLevelOverlay");
        if(ornament is not ("" or "auto" or "none"))
        {
            var expected=family+"-lv"+Math.Clamp(level,1,10).ToString("D2");
            if(!ornament.Equals(expected,StringComparison.OrdinalIgnoreCase))
                issues.Add("Levelgravur '"+ornament+"' statt der automatischen '"+expected+"'.");
        }
        var role=field("role").ToLowerInvariant();
        var icon=field("frameRoleIcon");
        var expectedIcon=role switch
        {
            "guardian" or "defender"=>"guardian-shield",
            "predator"=>"predator-skull","soul"=>"soul-spiral",
            "combatant" or "allrounder"=>"combatant-swords",
            "weaver" or "resonator"=>"weaver-rune",
            "support"=>"support-star","hunter"=>"hunter-arrow",_=>null
        };
        if(icon is not ("" or "auto" or "none") && expectedIcon!=null &&
           icon!=expectedIcon && !(role=="guardian"&&icon=="guardian-sword"))
            issues.Add("Manuelles Rollensymbol '"+icon+"' statt '"+expectedIcon+"'.");
        var art=field("art");
        if(draft.Image==null && art.Length>0 && AssetCatalog.ArtworkPreview(art)==null)
            issues.Add("Artwork-Referenz '"+art+"' ist nicht im eingebetteten Katalog: im Repository prüfen.");
        if(draft.Image==null && art.Length==0)
            issues.Add("Keine Bilddatei und kein bestehender Artwork-Pfad angegeben.");
        if(draft.Integration?.Availability=="preserve-existing" &&
           !AssetCatalog.Cards.Any(x=>x["id"]?.ToString()==field("id")))
            issues.Add("Bestehende Freischaltungen beibehalten gewählt, aber Karten-ID nicht im eingebetteten Katalog.");
        return issues;
    }

    static JsonObject IntegrationMetadata(CardDraft draft,bool approved)
    {
        var plan=draft.Integration??new CardIntegrationPlan();
        var warnings=AnalyzeIntent(draft);
        return new JsonObject
        {
            ["schema"]="arcane-duel-editor-intent-v1",
            ["cardId"]=draft.Card["id"]?.DeepClone(),
            ["catalogAction"]=AssetCatalog.Cards.Any(x=>x["id"]?.ToString()==draft.Card["id"]?.ToString())
                ?"update-catalog-entry":"create-or-check-live-id",
            ["availability"]=plan.Availability,
            ["booster"]=plan.Availability=="unlock-configured"&&plan.Booster,
            ["starterDeck"]=plan.Availability=="unlock-configured"&&plan.StarterDeck,
            ["questReward"]=plan.Availability=="unlock-configured"&&plan.QuestReward,
            ["unlockDetails"]=plan.Availability=="unlock-configured"?plan.UnlockDetails:"",
            ["visualDefinitionAuthoritative"]=true,
            ["nonstandardDesignConfirmedByUser"]=warnings.Count>0&&approved,
            ["warnings"]=new JsonArray(warnings.Select(x=>(JsonNode?)JsonValue.Create(x)).ToArray()),
            ["artworkSource"]=draft.Image!=null?"new-bundled-file":"existing-reference"
        };
    }

    bool ConfirmIntent(IReadOnlyList<CardDraft> drafts)
    {
        foreach(var d in drafts)ValidateDraft(d);
        var warnings=drafts.SelectMany(d=>AnalyzeIntent(d).Select(w=>
            "#"+d.Card["id"]+" "+d.Card["name"]+": "+w)).ToArray();
        if(warnings.Length==0)return true;
        using var win=new Form
        {
            Text="Exportbestätigung · bewusst abweichende Karteneigenschaften",
            Width=790,Height=560,MinimumSize=new Size(650,400),
            StartPosition=FormStartPosition.CenterParent,BackColor=Color.FromArgb(29,25,39),
            ForeColor=Color.FromArgb(238,229,207),Font=new Font("Segoe UI",10)
        };
        var info=new Label { Dock=DockStyle.Top,Height=66,Padding=new Padding(14,10,14,0),
            Text="Der Editor hat ungewöhnliche Eigenschaften entdeckt. Diese Werte werden NICHT korrigiert.\n"+
                 "Bitte die Hinweise prüfen und die exakt gewünschte Umsetzung ausdrücklich bestätigen." };
        var details=new TextBox {Dock=DockStyle.Fill,Multiline=true,ReadOnly=true,
            ScrollBars=ScrollBars.Vertical,BackColor=Color.FromArgb(42,35,51),
            ForeColor=Color.FromArgb(250,219,170),Text=string.Join(Environment.NewLine+Environment.NewLine,warnings)};
        var footer=new Panel {Dock=DockStyle.Bottom,Height=108};
        var accepted=new CheckBox {Left=14,Top=10,Width=735,Height=48,
            Text="Ich bestätige ausdrücklich: Alle aufgeführten Abweichungen sind gewollt und "+
                 "müssen beim späteren Spielimport exakt übernommen werden."};
        var continueBtn=new Button {Text="Bestätigen & exportieren",Width=215,
            Height=35,Left=win.ClientSize.Width-245,Top=63,Anchor=AnchorStyles.Right|AnchorStyles.Bottom,
            Enabled=false,DialogResult=DialogResult.OK};
        var cancel=new Button {Text="Abbrechen",Width=120,Height=35,
            Left=14,Top=63,DialogResult=DialogResult.Cancel};
        accepted.CheckedChanged+=(_,_)=>continueBtn.Enabled=accepted.Checked;
        footer.Controls.Add(accepted);footer.Controls.Add(continueBtn);footer.Controls.Add(cancel);
        win.Controls.Add(details);win.Controls.Add(info);win.Controls.Add(footer);
        win.AcceptButton=continueBtn;win.CancelButton=cancel;
        return win.ShowDialog(this)==DialogResult.OK&&accepted.Checked;
    }
}
