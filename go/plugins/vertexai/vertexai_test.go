// Copyright 2024 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package vertexai_test

import (
	"context"
	"flag"
	"testing"

	"github.com/FirebasePrivate/genkit/go/plugins/vertexai"
)

// The tests here only work with an API key set to a valid value.
var apiKey = flag.String("key", "", "Gemini API key")

func TestTextEmbedder(t *testing.T) {
	if *apiKey == "" {
		t.Skipf("no -key provided")
	}
	ctx := context.Background()
	a, err := vertexai.NewTextEmbedder(ctx, "embedding-001", *apiKey)
	if err != nil {
		t.Fatal(err)
	}
	out, err := a.Run(ctx, "yellow banana")
	if err != nil {
		t.Fatal(err)
	}

	// There's not a whole lot we can test about the result.
	// Just do a few sanity checks.
	if len(out) < 100 {
		t.Errorf("embedding vector looks too short: len(out)=%d", len(out))
	}
	var normSquared float32
	for _, x := range out {
		normSquared += x * x
	}
	if normSquared < 0.9 || normSquared > 1.1 {
		t.Errorf("embedding vector not unit length: %f", normSquared)
	}
}