package utils

import (
	"regexp"
	"unicode/utf8"
)

var tagPattern = regexp.MustCompile(`<[^>]+>`)

// CountCharacters returns the number of UTF-8 characters, optionally stripping tags.
func CountCharacters(input string, stripTags bool) int {
	content := input
	if stripTags {
		content = tagPattern.ReplaceAllString(content, "")
	}
	return utf8.RuneCountInString(content)
}
