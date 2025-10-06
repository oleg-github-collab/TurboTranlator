package utils

import "testing"

func TestCountCharacters(t *testing.T) {
	cases := []struct {
		name      string
		input     string
		stripTags bool
		expected  int
	}{
		{"plain", "hello world", false, 11},
		{"unicode", "Привіт", false, 6},
		{"tags", "<p>Hallo <strong>Welt</strong></p>", true, 10},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := CountCharacters(tc.input, tc.stripTags)
			if got != tc.expected {
				t.Fatalf("expected %d got %d", tc.expected, got)
			}
		})
	}
}
