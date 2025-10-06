package translation

import "github.com/olehkaminskyi/kaminskyi-language-intelligence/internal/models"

// ProviderType enumerates translation providers.
type ProviderType string

const (
	ProviderDeepL       ProviderType = "deepl"
	ProviderOTranslator ProviderType = "otranslator"
)

// Model defines translation tier metadata.
type Model struct {
	models.ModelDescriptor
	Provider          ProviderType
	Engine            string
	SupportsFormality bool
	SupportsGlossary  bool
	SupportsDocuments bool
	SupportsImages    bool
	SupportsXMLTags   bool
}

// Catalog lists supported models.
var Catalog = []Model{
	{
		ModelDescriptor: models.ModelDescriptor{
			Key:          "kaminskyi-basic",
			DisplayName:  "Kaminskyi Basic",
			Provider:     string(ProviderDeepL),
			Tier:         "Basic",
			PricePer1860: 0.28,
			Currency:     "EUR",
			Features: []string{
				"Schnelle Standardübersetzungen",
				"Unterstützt über 30 Sprachen",
				"Automatische Spracherkennung",
			},
			Options: map[string]string{
				"formality": "default",
				"priority":  "standard",
			},
			MaxCharacters: 100000,
			SpeedScore:    8,
			AccuracyScore: 7,
		},
		Provider:          ProviderDeepL,
		Engine:            "deepl-standard",
		SupportsFormality: true,
		SupportsGlossary:  false,
		SupportsDocuments: true,
		SupportsImages:    false,
		SupportsXMLTags:   true,
	},
	{
		ModelDescriptor: models.ModelDescriptor{
			Key:          "kaminskyi-standard",
			DisplayName:  "Kaminskyi Standard",
			Provider:     string(ProviderDeepL),
			Tier:         "Standard",
			PricePer1860: 0.40,
			Currency:     "EUR",
			Features: []string{
				"Formality-Optionen",
				"HTML/XML-Tag Erhaltung",
				"Glossar Unterstützung",
			},
			Options: map[string]string{
				"formality": "more",
				"priority":  "standard",
			},
			MaxCharacters: 200000,
			SpeedScore:    7,
			AccuracyScore: 8,
		},
		Provider:          ProviderDeepL,
		Engine:            "deepl-advanced",
		SupportsFormality: true,
		SupportsGlossary:  true,
		SupportsDocuments: true,
		SupportsImages:    false,
		SupportsXMLTags:   true,
	},
	{
		ModelDescriptor: models.ModelDescriptor{
			Key:          "kaminskyi-pro",
			DisplayName:  "Kaminskyi Pro",
			Provider:     string(ProviderDeepL),
			Tier:         "Pro",
			PricePer1860: 0.55,
			Currency:     "EUR",
			Features: []string{
				"Kontextbewusste Übersetzung",
				"Custom Glossaries",
				"Tag Handling und Placeholders",
			},
			Options: map[string]string{
				"formality": "prefer_more",
				"priority":  "priority",
			},
			MaxCharacters: 250000,
			SpeedScore:    7,
			AccuracyScore: 9,
		},
		Provider:          ProviderDeepL,
		Engine:            "deepl-pro",
		SupportsFormality: true,
		SupportsGlossary:  true,
		SupportsDocuments: true,
		SupportsImages:    false,
		SupportsXMLTags:   true,
	},
	{
		ModelDescriptor: models.ModelDescriptor{
			Key:          "kaminskyi-elite",
			DisplayName:  "Kaminskyi Elite",
			Provider:     string(ProviderOTranslator),
			Tier:         "Elite",
			PricePer1860: 0.70,
			Currency:     "EUR",
			Features: []string{
				"Bild-zu-Text Übersetzung",
				"Szenario-optimierte Styles",
				"Mehrfach Glossar-Sets",
			},
			Options: map[string]string{
				"priority": "priority",
				"passes":   "1",
			},
			MaxCharacters: 300000,
			SpeedScore:    6,
			AccuracyScore: 9,
		},
		Provider:          ProviderOTranslator,
		Engine:            "otranslator-elite",
		SupportsFormality: true,
		SupportsGlossary:  true,
		SupportsDocuments: true,
		SupportsImages:    true,
		SupportsXMLTags:   true,
	},
	{
		ModelDescriptor: models.ModelDescriptor{
			Key:          "kaminskyi-epic",
			DisplayName:  "Kaminskyi Epic",
			Provider:     string(ProviderOTranslator),
			Tier:         "Epic",
			PricePer1860: 0.85,
			Currency:     "EUR",
			Features: []string{
				"Batch-Verarbeitung",
				"Adaptive Tonalität",
				"Fehlererkennung in mehreren Durchläufen",
			},
			Options: map[string]string{
				"priority": "priority",
				"passes":   "2",
			},
			MaxCharacters: 400000,
			SpeedScore:    5,
			AccuracyScore: 9,
		},
		Provider:          ProviderOTranslator,
		Engine:            "otranslator-epic",
		SupportsFormality: true,
		SupportsGlossary:  true,
		SupportsDocuments: true,
		SupportsImages:    true,
		SupportsXMLTags:   true,
	},
	{
		ModelDescriptor: models.ModelDescriptor{
			Key:          "kaminskyi-ultimate",
			DisplayName:  "Kaminskyi Ultimate",
			Provider:     string(ProviderOTranslator),
			Tier:         "Ultimate",
			PricePer1860: 0.96,
			Currency:     "EUR",
			Features: []string{
				"Dreifache KI-Nachbearbeitung",
				"Premium Glossare & Stilrichtlinien",
				"Priorisierte Warteschlange",
			},
			Options: map[string]string{
				"priority": "priority",
				"passes":   "3",
			},
			MaxCharacters: 500000,
			SpeedScore:    4,
			AccuracyScore: 10,
		},
		Provider:          ProviderOTranslator,
		Engine:            "otranslator-ultimate",
		SupportsFormality: true,
		SupportsGlossary:  true,
		SupportsDocuments: true,
		SupportsImages:    true,
		SupportsXMLTags:   true,
	},
}

// GetModelByKey returns model descriptor by key.
func GetModelByKey(key string) *Model {
	for _, model := range Catalog {
		if model.ModelDescriptor.Key == key {
			m := model
			return &m
		}
	}
	return nil
}

// ListModelDescriptors returns sanitized descriptors for API responses.
func ListModelDescriptors() []models.ModelDescriptor {
	descriptors := make([]models.ModelDescriptor, 0, len(Catalog))
	for _, model := range Catalog {
		descriptors = append(descriptors, model.ModelDescriptor)
	}
	return descriptors
}
