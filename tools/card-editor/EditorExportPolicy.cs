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


    // Two user-facing decisions replace three technical modes which had
    // overlapping meaning. The export still distinguishes an existing card
    // ("preserve-existing") from a newly created one ("catalog-only").
    readonly RadioButton keepAvailability=new()
    {
        Text="Nur die Karte erstellen oder bearbeiten",AutoSize=false,
        Width=475,Height=28,Font=new Font("Segoe UI",11,FontStyle.Bold),
        ForeColor=Color.FromArgb(247,233,204),UseVisualStyleBackColor=false
    };
    readonly RadioButton changeAvailability=new()
    {
        Text="Die Karte zusätzlich für Spieler freischalten",AutoSize=false,
        Width=475,Height=28,Font=new Font("Segoe UI",11,FontStyle.Bold),
        ForeColor=Color.FromArgb(247,233,204),UseVisualStyleBackColor=false
    };
    readonly Panel keepChoice=new() {Width=530,Height=92};
    readonly Panel changeChoice=new() {Width=530,Height=103};
    readonly FlowLayoutPanel unlockSettings=new()
    {
        Width=530,AutoSize=true,AutoSizeMode=AutoSizeMode.GrowAndShrink,
        FlowDirection=FlowDirection.TopDown,WrapContents=false,
        BackColor=Color.FromArgb(28,25,36),Margin=new Padding(2,6,2,5)
    };
    readonly CheckBox boosterUnlock=new()
    {
        Text="In Boostern erhältlich",Width=505,Height=28,
        ForeColor=Color.FromArgb(250,240,222),UseVisualStyleBackColor=false
    };
    readonly CheckBox starterUnlock=new()
    {
        Text="Ins Startdeck / in die Startsammlung",Width=505,Height=28,
        ForeColor=Color.FromArgb(250,240,222),UseVisualStyleBackColor=false
    };
    readonly CheckBox questUnlock=new()
    {
        Text="Als Belohnung zu gewinnen",Width=505,Height=28,
        ForeColor=Color.FromArgb(250,240,222),UseVisualStyleBackColor=false
    };
    readonly TextBox unlockDetails=new()
    {
        Width=512,Height=95,Multiline=true,ScrollBars=ScrollBars.Vertical,
        BackColor=Color.FromArgb(48,42,54),ForeColor=Color.FromArgb(255,249,235),
        BorderStyle=BorderStyle.FixedSingle,
        PlaceholderText="Beschreibe ganz konkret, wann und wo die Karte erhältlich sein soll."
    };
    readonly Label integrationHint=new()
    {
        AutoSize=true,MaximumSize=new Size(520,0),
        ForeColor=Color.FromArgb(230,202,151)
    };
    readonly Label choiceSummary=new()
    {
        AutoSize=true,MaximumSize=new Size(520,0),
        ForeColor=Color.FromArgb(225,212,185),
        Font=new Font("Segoe UI",10,FontStyle.Regular),
        Margin=new Padding(4,8,4,8)
    };
    readonly Label releaseHint=new()
    {
        AutoSize=true,MaximumSize=new Size(510,0),
        ForeColor=Color.FromArgb(222,199,154),
        Margin=new Padding(5,4,5,8)
    };

    static Label HelperLabel(string text,int width=510) => new()
    {
        Text=text,AutoSize=true,MaximumSize=new Size(width,0),
        ForeColor=Color.FromArgb(196,186,174),
        Font=new Font("Segoe UI",9),
        Margin=new Padding(8,0,4,8)
    };

    static void BuildOption(Panel panel,RadioButton radio,string explanation)
    {
        panel.BackColor=Color.FromArgb(45,39,56);
        panel.BorderStyle=BorderStyle.FixedSingle;
        var help=new Label
        {
            Text=explanation,Left=17,Top=41,Width=486,Height=48,
            ForeColor=Color.FromArgb(220,210,195),
            Font=new Font("Segoe UI",9)
        };
        radio.Left=13;radio.Top=9;radio.BackColor=panel.BackColor;
        panel.Controls.Add(radio);panel.Controls.Add(help);
        panel.Click+=(_,_)=>radio.Checked=true;
        help.Click+=(_,_)=>radio.Checked=true;
    }

    void SetupIntegrationControls(FlowLayoutPanel stack)
    {
        AddTitle(stack,"Wer darf diese Karte bekommen?");
        stack.Controls.Add(new Label
        {
            AutoSize=true,MaximumSize=new Size(520,0),Margin=new Padding(5,2,4,12),
            Text="Hier bestimmst du, ob Spieler die Karte bekommen können. "+
                 "Du kannst sie auch erst einmal nur im Spiel hinterlegen. "+
                 "Nichts davon wird sofort online geändert."
        });
        stack.Controls.Add(integrationHint);
        AddFieldLabel(stack,"Was möchtest du mit der Karte machen?");
        BuildOption(keepChoice,keepAvailability,
            "Die Karte wird im Spiel gespeichert. Neue Karten erscheinen noch "+
            "nicht in Boostern, Startdecks oder Belohnungen. "+
            "Bei vorhandenen Karten bleiben die bisherigen Freischaltungen erhalten.");
        BuildOption(changeChoice,changeAvailability,
            "Die Karte wird gespeichert UND soll für Spieler erhältlich sein. "+
            "Im nächsten Schritt legst du fest, wo und ab wann.");
        stack.Controls.Add(keepChoice);
        stack.Controls.Add(changeChoice);

        AddFieldLabel(unlockSettings,"Wo sollen Spieler die Karte bekommen können?");
        void addTarget(CheckBox box,string explanation)
        {
            var row=new FlowLayoutPanel
            {
                Width=522,AutoSize=true,FlowDirection=FlowDirection.TopDown,
                WrapContents=false,Margin=new Padding(0,3,0,5)
            };
            box.Margin=new Padding(6,0,0,0);
            row.Controls.Add(box);
            row.Controls.Add(HelperLabel(explanation,490));
            unlockSettings.Controls.Add(row);
            box.CheckedChanged+=(_,_)=>UpdateReleaseSummary();
        }
        addTarget(boosterUnlock,
            "Sie kann aus Kartenpaketen gezogen werden. Im Text unten gibst du an, "+
            "welche Booster und ab welchem Fortschritt.");
        addTarget(starterUnlock,
            "Sie soll beim Spielstart im Deck oder in der Sammlung verfügbar sein. "+
            "Gib an, für welche Spieler das gelten soll.");
        addTarget(questUnlock,
            "Sie ist zum Beispiel ein Gewinn nach einem Gegner, einer Quest "+
            "oder einer Turnierprüfung.");

        AddFieldLabel(unlockSettings,"Wann genau soll die Karte erhältlich sein?");
        unlockSettings.Controls.Add(unlockDetails);
        unlockSettings.Controls.Add(HelperLabel(
            "Beispiel: „Nach der 3. Turnierprüfung im Feuer-Booster erhältlich.“ "+
            "Oder: „Nach dem Sieg über Gegner VII einmalig als Belohnung.“",504));
        unlockSettings.Controls.Add(releaseHint);
        stack.Controls.Add(unlockSettings);
        stack.Controls.Add(choiceSummary);

        // WinForms radio buttons in separate option panels need explicit
        // mutual exclusion; otherwise both may be checked at the same time.
        keepAvailability.CheckedChanged+=(_,_)=>
        {
            if(keepAvailability.Checked)changeAvailability.Checked=false;
            UpdateUnlockUi();
        };
        changeAvailability.CheckedChanged+=(_,_)=>
        {
            if(changeAvailability.Checked)keepAvailability.Checked=false;
            UpdateUnlockUi();
        };
        fields["id"].TextChanged+=(_,_)=>UpdateIntegrationHint();
        keepAvailability.Checked=true;
        UpdateIntegrationHint();
        UpdateUnlockUi();
    }

    bool IsKnownCard(JsonObject card)
    {
        var id=card["id"]?.ToString();
        return AssetCatalog.Cards.Any(c=>c["id"]?.ToString()==id);
    }


    void ResetIntegrationForCard(JsonObject? card=null)
    {
        keepAvailability.Checked=true;
        boosterUnlock.Checked=starterUnlock.Checked=questUnlock.Checked=false;
        unlockDetails.Text="";
        UpdateUnlockUi();
    }

    void UpdateIntegrationHint()
    {
        if(!fields.TryGetValue("id",out var id))return;
        var value=id.Text.Trim();
        if(!int.TryParse(value,out var n)||n<0)
        {
            integrationHint.Text="Noch keine gültige Karten-ID angegeben. "+
                "Gib im Reiter „Monster & Werte“ eine eindeutige Zahl ein.";
            return;
        }
        var known=AssetCatalog.Cards.FirstOrDefault(c=>c["id"]?.ToString()==value);
        integrationHint.Text=known!=null
            ?"Karte #"+value+" gehört bereits zu „"+known["name"]+"“. "+
              "Beim Import werden die Daten dieser Karte aktualisiert, keine zweite Karte mit derselben ID erzeugt."
            :"Karte #"+value+" ist im mitgelieferten Katalog noch nicht vorhanden. "+
              "Ob diese ID im aktuellen Spiel tatsächlich frei ist, wird beim Import geprüft.";
    }

    void UpdateReleaseSummary()
    {
        if(!changeAvailability.Checked)
        {
            choiceSummary.Text="Ergebnis: Die Karte wird beim späteren Import angelegt "+
                "oder bearbeitet. Es werden keine neuen Freischaltungen eingerichtet.";
            return;
        }
        var chosen=new List<string>();
        if(boosterUnlock.Checked)chosen.Add("Booster");
        if(starterUnlock.Checked)chosen.Add("Startdeck/Startsammlung");
        if(questUnlock.Checked)chosen.Add("Belohnung");
        releaseHint.Text=chosen.Count==0
            ?"Wähle mindestens eine Möglichkeit aus. Erst danach kann diese Karte freigeschaltet werden."
            :"Ausgewählt: "+string.Join(", ",chosen)+
              ". Vergiss nicht, den genauen Zeitpunkt und die Bedingungen zu beschreiben.";
        choiceSummary.Text="Ergebnis: Die Karte wird beim späteren Import angelegt "+
            "oder bearbeitet. Zusätzlich sollen genau die ausgewählten Freischaltungen "+
            "eingerichtet werden – keine weiteren.";
    }

    void UpdateUnlockUi()
    {
        var requested=changeAvailability.Checked;
        unlockSettings.Visible=requested;
        foreach(var panel in new[]{keepChoice,changeChoice})
            panel.BackColor=Color.FromArgb(45,39,56);
        keepChoice.BackColor=keepAvailability.Checked
            ?Color.FromArgb(68,56,73):Color.FromArgb(45,39,56);
        changeChoice.BackColor=changeAvailability.Checked
            ?Color.FromArgb(68,56,73):Color.FromArgb(45,39,56);
        keepAvailability.BackColor=keepChoice.BackColor;
        changeAvailability.BackColor=changeChoice.BackColor;
        UpdateIntegrationHint();
        UpdateReleaseSummary();
    }

    CardIntegrationPlan CapturePlan()=>new()
    {
        Availability=changeAvailability.Checked
            ?"unlock-configured"
            :(AssetCatalog.Cards.Any(x=>x["id"]?.ToString()==fields["id"].Text.Trim())
                ?"preserve-existing":"catalog-only"),
        Booster=changeAvailability.Checked&&boosterUnlock.Checked,
        StarterDeck=changeAvailability.Checked&&starterUnlock.Checked,
        QuestReward=changeAvailability.Checked&&questUnlock.Checked,
        UnlockDetails=changeAvailability.Checked?unlockDetails.Text.Trim():""
    };

    void ApplyPlan(CardIntegrationPlan? plan)
    {
        plan??=new CardIntegrationPlan();
        // Both legacy states mean "don't add any new unlocks".
        changeAvailability.Checked=plan.Availability=="unlock-configured";
        keepAvailability.Checked=!changeAvailability.Checked;
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
                    ": Bitte wähle aus, wo Spieler die Karte bekommen können (Booster, Startdeck oder Belohnung).");
            if(string.IsNullOrWhiteSpace(plan.UnlockDetails))
                throw new InvalidOperationException("Karte "+draft.Card["id"]+
                    ": Bitte beschreibe, wann und wie Spieler diese Karte erhalten sollen.");
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
