/* ============================================================
   Depot Catalog - translations.js
   ------------------------------------------------------------
   This file contains ALL user-facing texts of the application.
   Non-technical users can edit or extend it:

   HOW TO ADD OR MODIFY A LANGUAGE
   -------------------------------
   1. Each language is ONE block between { and }, looking like:

        { code: "en", label: "English", strings: { ... } }

      - code  : short language code used internally ("tr", "en", ...)
      - label : language name displayed in the UI
      - strings: the translated texts

   2. To add a language, copy an existing block, paste it below,
      change code/label and translate every value on the right side.
      Keep the quotes and commas exactly as they are.

   3. Words in curly braces such as {name}, {cur}, {n}, {query}
      are filled in by the app automatically - do NOT translate or
      remove the braces themselves.

   IMPORTANT
   ---------
   - The application reads this file when the page opens.
   - If this file is missing or broken, the app shows a small
     technical error message (in English) and stops.
   - This file must stay valid JavaScript. After editing, reload
     the page; if you see the error message, a typo was made.
   ============================================================ */

window.DEPOT_LANGUAGES = [

  /* ------------------ ENGLISH ------------------ */
  {
    code: "en",
    label: "English",
    strings: {
      docTitle: "Depot Catalog",
      appTitle: "Depot Catalog",
      addTitle: "Add New Product",
      editTitle: "Edit Product",
      nameLbl: "Product name",
      locLbl: "Location",
      phName: "Product",
      phLoc: "A-1",
      add: "Add",
      save: "Save",
      cancel: "Cancel",
      searchPh: "Search by product name or location…",
      colName: "Product",
      colLoc: "Location",
      emptyList: "No records yet. Add your first record using “Add/Import Product”.",
      noResults: "No results for “{query}”.",
      itemCount: "{n} item(s)",
      addNewBtn: "Add/Import Product",
      clearSearchAria: "Clear search",
      switchToLight: "Switch to light mode",
      switchToDark: "Switch to dark mode",
      download: "Export to CSV",
      upload: "Import from CSV",
      delTitle: "🗑️ Delete Product",
      delConfirm: "Delete “{name}”? This cannot be undone.",
      del: "Delete",
      impTitle: "Import from CSV",
      impApplyBtn: "Import",
      editAria: "Edit: {name}",
      delAria: "Delete: {name}",
      searchAria: "Search products",
      langAria: "Language selection",
      nameReq: "❌ Product name is required.",
      added: "✅ Product added.",
      updated: "✅ Product updated.",
      deleted: "✅ Product deleted.",
      imported: "✅ Imported: {n} new record(s) added.",
      exported: "✅ Export file downloaded.",
      csvBadHeader: "❌ CSV header row must contain “Name” and “Location” columns.",
      impSumTitle: "📋 Import summary",
      impSumValid: "✅ Rows to import: {n}",
      impSumDup: "⚠️ Duplicate rows skipped: {n}",
      impSumMissing: "❌ Rows with missing fields skipped: {n}",
      skippedListTitle: "Skipped rows:",
      skippedRow: "Row {n}",
      reasonDup: "duplicate",
      reasonNoName: "missing name",
      reasonNoLoc: "missing location",
      reasonNoBoth: "missing both",
      impReportTitle: "ℹ️ Import finished – some rows were skipped",
      invalidFile: "❌ The file could not be read or is not a valid CSV file.",
      storageWarn: "⚠️ Browser storage is unavailable. Your data will only be kept for this session and lost when the page closes.",
      corruptWarn: "⚠️ Saved data could not be read; starting with an empty list.",
      locMissingTitle: "⚠️ Location Missing",
      locMissingMsg: "No location was entered for “{name}”. Continue without a location?",
      dupExactTitle: "⚠️ Product Already Exists",
      dupExactMsg: "This product already exists at this location.",
      dupWarnTitle: "⚠️ Same Product, Different Location",
      dupWarnMsg: "A product with this name already exists at another location. Do you want to add it anyway?",
      contAnyway: "Continue anyway",
      ok: "OK",
      disclaimer: "All data is stored locally on your device. To use your catalog on another device, export a backup and import it there.",
      suggestAria: "Matching products",
      close: "Close",
      pageSizeLbl: "Items per page",
      prevPage: "Previous",
      nextPage: "Next",
      paginationAria: "Stock list pages",
      pageAria: "Go to page {n}",
      githubAria: "View on GitHub"
    }
  },
  /* ------------------ TÜRKÇE ------------------ */
  {
    code: "tr",
    label: "Türkçe",
    strings: {
      docTitle: "Depo Kataloğu",
      appTitle: "Depo Kataloğu",
      addTitle: "Yeni Ürün Ekle",
      editTitle: "Ürünü Düzenle",
      nameLbl: "Ürün adı",
      locLbl: "Konum",
      phName: "Ürün",
      phLoc: "A-1",
      add: "Ekle",
      save: "Kaydet",
      cancel: "İptal",
      searchPh: "Ürün adı veya konuma göre ara…",
      colName: "Ürün",
      colLoc: "Konum",
      emptyList: "Henüz kayıt yok. “Ürün Ekle/İçe Aktar” ile ilk kaydınızı ekleyin.",
      noResults: "“{query}” için sonuç bulunamadı.",
      itemCount: "{n} ürün",
      addNewBtn: "Ürün Ekle/İçe Aktar",
      clearSearchAria: "Aramayı temizle",
      switchToLight: "Aydınlık temaya geç",
      switchToDark: "Koyu temaya geç",
      download: "CSV'ye Aktar",
      upload: "CSV'den İçe Aktar",
      delTitle: "🗑️ Ürünü Sil",
      delConfirm: "“{name}” silinsin mi? Bu işlem geri alınamaz.",
      del: "Sil",
      impTitle: "CSV'den İçe Aktar",
      impApplyBtn: "İçe Aktar",
      editAria: "Düzenle: {name}",
      delAria: "Sil: {name}",
      searchAria: "Ürün ara",
      langAria: "Dil seçimi",
      nameReq: "❌ Ürün adı gereklidir.",
      added: "✅ Ürün eklendi.",
      updated: "✅ Ürün güncellendi.",
      deleted: "✅ Ürün silindi.",
      imported: "✅ İçe aktarıldı: {n} yeni kayıt eklendi.",
      exported: "✅ CSV dosyası indirildi.",
      csvBadHeader: "❌ CSV başlık satırında “Name” ve “Location” sütunları bulunmalıdır.",
      impSumTitle: "📋 İçe aktarma özeti",
      impSumValid: "✅ İçe aktarılacak satır: {n}",
      impSumDup: "⚠️ Yinelenen satır (atlanacak): {n}",
      impSumMissing: "❌ Eksik alanlı satır (atlanacak): {n}",
      skippedListTitle: "Atlanan satırlar:",
      skippedRow: "Satır {n}",
      reasonDup: "yinelenen",
      reasonNoName: "ürün adı eksik",
      reasonNoLoc: "konum eksik",
      reasonNoBoth: "her ikisi eksik",
      impReportTitle: "ℹ️ İçe aktarma tamamlandı – bazı satırlar atlandı",
      invalidFile: "❌ Dosya okunamadı veya geçerli bir CSV dosyası değil.",
      storageWarn: "⚠️ Tarayıcı depolamasına erişilemiyor. Verileriniz yalnızca bu oturum boyunca tutulacak ve sayfa kapatıldığında kaybolacaktır.",
      corruptWarn: "⚠️ Kayıtlı veriler okunamadı; boş liste ile başlandı.",
      locMissingTitle: "⚠️ Konum Eksik",
      locMissingMsg: "“{name}” için konum girilmedi. Konum olmadan devam edilsin mi?",
      dupExactTitle: "⚠️ Ürün Zaten Mevcut",
      dupExactMsg: "Bu ürün bu konumda zaten kayıtlı.",
      dupWarnTitle: "⚠️ Aynı Ürün, Farklı Konum",
      dupWarnMsg: "Aynı adda ürün başka bir konumda zaten var. Yine de eklemek istiyor musunuz?",
      contAnyway: "Yine de devam et",
      ok: "Tamam",
      disclaimer: "Tüm veriler cihazınızda yerel olarak saklanır. Kataloğunuzu başka bir cihazda kullanmak için bir yedek dışa aktarın ve orada içe aktarın.",
      suggestAria: "Eşleşen ürünler",
      close: "Kapat",
      pageSizeLbl: "Sayfa başına öğe",
      prevPage: "Önceki",
      nextPage: "Sonraki",
      paginationAria: "Stok listesi sayfaları",
      pageAria: "Sayfaya git: {n}",
      githubAria: "GitHub'da görüntüle"
    }
  }

];

