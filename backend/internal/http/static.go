package http

import (
    "net/http"
    "os"
    "path/filepath"
    "strings"

    "github.com/go-chi/chi/v5"
)

// AttachStatic configures SPA fallback serving files from dir when present.
func AttachStatic(r *chi.Mux, root string) {
    info, err := os.Stat(root)
    if err != nil || !info.IsDir() {
        return
    }

    fileServer := http.FileServer(http.Dir(root))

    r.NotFound(func(w http.ResponseWriter, req *http.Request) {
        if strings.HasPrefix(req.URL.Path, "/api") {
            http.NotFound(w, req)
            return
        }
        fullPath := filepath.Join(root, filepath.Clean(req.URL.Path))
        if stat, err := os.Stat(fullPath); err == nil && !stat.IsDir() {
            fileServer.ServeHTTP(w, req)
            return
        }
        http.ServeFile(w, req, filepath.Join(root, "index.html"))
    })
}
