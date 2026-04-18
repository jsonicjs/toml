// Copyright (c) 2021-2026 Richard Rodger, MIT License

package toml

import (
	jsonic "github.com/jsonicjs/jsonic/go"
)

// makeRefs builds the function reference map that the grammar file
// references via @-prefixed strings. State-action names
// (@<rule>-<bo|ao|bc|ac>) are auto-wired by Jsonic's Grammar() via
// wireStateActions.
func makeRefs() map[jsonic.FuncRef]any {
	return map[jsonic.FuncRef]any{

		// --- State actions (auto-wired by rule name convention) ---

		"@toml-bo": jsonic.StateAction(func(r *jsonic.Rule, _ *jsonic.Context) {
			r.Node = make(map[string]any)
		}),

		"@table-bo": jsonic.StateAction(func(r *jsonic.Rule, _ *jsonic.Context) {
			r.Node = r.Parent.Node
		}),

		"@table-bc": jsonic.StateAction(func(r *jsonic.Rule, _ *jsonic.Context) {
			if r.U["top_dive"] != nil {
				return
			}
			if r.Child == nil || r.Child == jsonic.NoRule {
				return
			}
			child, okc := r.Child.Node.(map[string]any)
			node, okn := r.Node.(map[string]any)
			if !okc || !okn {
				return
			}
			for k, v := range child {
				node[k] = v
			}
		}),

		"@dive-bc": jsonic.StateAction(func(r *jsonic.Rule, _ *jsonic.Context) {
			if r.U["dive_end"] == nil {
				return
			}
			if r.O0 == nil || r.O0 == jsonic.NoToken {
				return
			}
			key, ok := r.O0.Val.(string)
			if !ok {
				return
			}
			if node, ok := r.Node.(map[string]any); ok {
				node[key] = r.Child.Node
			}
		}),

		// --- Alt actions ---

		"@table-dive-start": jsonic.AltAction(func(r *jsonic.Rule, _ *jsonic.Context) {
			key := tokenString(r.O0)
			parent, ok := r.Parent.Node.(map[string]any)
			if !ok {
				return
			}
			if r.N["table_array"] > 0 {
				if arr, ok := parent[key].([]any); ok {
					if len(arr) > 0 {
						if last, ok := arr[len(arr)-1].(map[string]any); ok {
							r.Node = last
							return
						}
					}
					newMap := make(map[string]any)
					parent[key] = append(arr, newMap)
					r.Node = newMap
					return
				}
			}
			if existing, ok := parent[key].(map[string]any); ok {
				r.Node = existing
				return
			}
			newMap := make(map[string]any)
			parent[key] = newMap
			r.Node = newMap
		}),

		"@table-dive-mid": jsonic.AltAction(func(r *jsonic.Rule, _ *jsonic.Context) {
			key := tokenString(r.O0)
			if arr, ok := r.Prev.Node.([]any); ok {
				var last map[string]any
				if len(arr) > 0 {
					last, _ = arr[len(arr)-1].(map[string]any)
				}
				if last == nil {
					last = make(map[string]any)
					arr = append(arr, last)
					// Note: arr is a local copy; without writing back, the
					// caller's slice header isn't updated. Handled by
					// append to parent's field on table close.
				}
				next, ok := last[key].(map[string]any)
				if !ok {
					next = make(map[string]any)
					last[key] = next
				}
				r.Node = next
				return
			}
			prev, ok := r.Prev.Node.(map[string]any)
			if !ok {
				return
			}
			next, ok := prev[key].(map[string]any)
			if !ok {
				next = make(map[string]any)
				prev[key] = next
			}
			r.Node = next
		}),

		"@table-key-cs-head": jsonic.AltAction(func(r *jsonic.Rule, _ *jsonic.Context) {
			key := tokenString(r.O0)
			parent, ok := r.Parent.Node.(map[string]any)
			if !ok {
				return
			}
			existing := parent[key]
			if existing == nil {
				if r.N["table_array"] > 0 {
					arr := []any{}
					parent[key] = arr
					r.Node = arr
				} else {
					m := make(map[string]any)
					parent[key] = m
					r.Node = m
				}
				return
			}
			r.Node = existing
			parent[key] = existing
		}),

		"@table-key-cs-tail": jsonic.AltAction(func(r *jsonic.Rule, _ *jsonic.Context) {
			key := tokenString(r.O0)
			if arr, ok := r.Prev.Node.([]any); ok {
				var last map[string]any
				if len(arr) > 0 {
					last, _ = arr[len(arr)-1].(map[string]any)
				}
				if last == nil {
					last = make(map[string]any)
					arr = append(arr, last)
				}
				next, ok := last[key].(map[string]any)
				if !ok {
					next = make(map[string]any)
					last[key] = next
				}
				r.Node = next
				return
			}
			prev, ok := r.Prev.Node.(map[string]any)
			if !ok {
				return
			}
			existing := prev[key]
			if existing == nil {
				if r.N["table_array"] > 0 {
					arr := []any{}
					prev[key] = arr
					r.Node = arr
				} else {
					m := make(map[string]any)
					prev[key] = m
					r.Node = m
				}
				return
			}
			r.Node = existing
		}),

		"@table-cs-push": jsonic.AltAction(func(r *jsonic.Rule, _ *jsonic.Context) {
			newMap := make(map[string]any)
			if arr, ok := r.Prev.Node.([]any); ok {
				r.Prev.Node = append(arr, newMap)
			}
			r.Node = newMap
		}),

		"@pair-key-set": jsonic.AltAction(func(r *jsonic.Rule, _ *jsonic.Context) {
			if r.O0 != nil && r.O0 != jsonic.NoToken {
				r.U["key"] = r.O0.Val
			}
		}),

		"@dive-key-dot": jsonic.AltAction(func(r *jsonic.Rule, _ *jsonic.Context) {
			key := tokenString(r.O0)
			parent, ok := r.Parent.Node.(map[string]any)
			if !ok {
				return
			}
			existing, ok := parent[key].(map[string]any)
			if !ok {
				existing = make(map[string]any)
				parent[key] = existing
			}
			r.Node = existing
		}),

		// --- Conditions ---

		"@table-top-dive-cond": jsonic.AltCond(func(r *jsonic.Rule, _ *jsonic.Context) bool {
			return r.D == 1 && (r.Prev == nil || r.Prev.Name != "table")
		}),

		"@lte-table-dive": jsonic.AltCond(func(r *jsonic.Rule, _ *jsonic.Context) bool {
			return r.Lte("table_dive", 0)
		}),

		"@lte-table-array-1": jsonic.AltCond(func(r *jsonic.Rule, _ *jsonic.Context) bool {
			return r.Lte("table_array", 1)
		}),

		"@lte-dive-key-1": jsonic.AltCond(func(r *jsonic.Rule, _ *jsonic.Context) bool {
			return r.Lte("dive_key", 1)
		}),

		"@lte-pk": jsonic.AltCond(func(r *jsonic.Rule, _ *jsonic.Context) bool {
			return r.Lte("pk", 0)
		}),

		"@map-is-table-parent": jsonic.AltCond(func(r *jsonic.Rule, _ *jsonic.Context) bool {
			return r.Parent != nil && r.Parent.Name == "table"
		}),

		// --- Dynamic push/replace targets ---

		"@table-end-p": func(r *jsonic.Rule, _ *jsonic.Context) string {
			if r.N["table_array"] > 0 {
				return ""
			}
			return "map"
		},

		"@table-end-r": func(r *jsonic.Rule, _ *jsonic.Context) string {
			if r.N["table_array"] > 0 {
				return "table"
			}
			return ""
		},
	}
}

// tokenString returns a token's value as a string.
func tokenString(t *jsonic.Token) string {
	if t == nil || t == jsonic.NoToken {
		return ""
	}
	if s, ok := t.Val.(string); ok {
		return s
	}
	if t.Src != "" {
		return t.Src
	}
	return ""
}
