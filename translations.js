/* ============================================================
   depotCatalog - translations.js
   ------------------------------------------------------------
   This file contains ALL user-facing texts of the application.
   Non-technical users can edit or extend it:

   HOW TO ADD OR MODIFY A LANGUAGE
   -------------------------------
   1. Each language is ONE block between { and }, looking like:

        { code: "en", label: "English", strings: { ... } }

      - code  : short language code shown/used internally ("tr", "en", "de", ...)
      - label : language name displayed in the switcher area
      - strings: the translated texts

   2. To add a language, copy an existing block, paste it below,
      change code/label and translate every value on the right side.
      Keep the quotes and commas exactly as they are.

   3. Words in curly braces such as {name}, {cur}, {inc}, {query}, {n}
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
      searchPh: "Search by product name or location\u2026",
      colName: "Product",
      colLoc: "Location",
      emptyList: "No entries yet. Click \u201C+ Add new product\u201D to add your first entry, or \u201CImport\u201D to load a backup.",
      noResults: "No results for \u201C{query}\u201D.",
      itemCount: "{n} item(s)",
      addNewBtn: "+ Add new product",
      clearSearchAria: "Clear search",
      download: "Export",
      upload: "Import",
      delTitle: "Confirm Deletion",
      delConfirm: "Delete \u201C{name}\u201D? This cannot be undone.",
      del: "Delete",
      impTitle: "Import Backup",
      impConfirm: "Your current {cur} record(s) will be replaced by {inc} record(s) from the backup file. Continue?",
      impReplace: "Replace",
      editAria: "Edit: {name}",
      delAria: "Delete: {name}",
      searchAria: "Search products",
      langAria: "Language selection",
      nameReq: "Product name is required.",
      added: "Product added.",
      updated: "Product updated.",
      deleted: "Product deleted.",
      imported: "Backup loaded: {n} record(s) imported.",
      exported: "Backup file is being downloaded\u2026",
      invalidFile: "The file could not be read or is not a valid backup file.",
      storageWarn: "Warning: Browser storage is unavailable. Your data will only be kept for this session and lost when the page closes.",
      corruptWarn: "Saved data could not be read; starting with an empty list.",
      locMissingTitle: "Location Missing",
      locMissingMsg: "No location was entered for \u201C{name}\u201D. Continue without a location?",
      dupExactTitle: "Product Already Exists",
      dupExactMsg: "\u201C{name}\u201D is already registered at location \u201C{location}\u201D. The same product cannot be added twice.",
      dupWarnTitle: "Same Product, Different Location",
      dupWarnMsg: "\u201C{name}\u201D already exists at another location. Add this new record anyway?",
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
      searchPh: "Ürün adı veya konuma göre ara\u2026",
      colName: "Ürün",
      colLoc: "Konum",
      emptyList: "Henüz kayıt yok. “+ Yeni ürün ekle” ile ilk kaydınızı ekleyin veya “İçe Aktar” ile bir yedek yükleyin.",
      noResults: "\u201C{query}\u201D için sonuç bulunamadı.",
      itemCount: "{n} ürün",
      addNewBtn: "+ Yeni ürün ekle",
      clearSearchAria: "Aramayı temizle",
      download: "Dışa Aktar",
      upload: "İçe Aktar",
      delTitle: "Silme Onayı",
      delConfirm: "\u201C{name}\u201D silinsin mi? Bu işlem geri alınamaz.",
      del: "Sil",
      impTitle: "Yedeği İçe Aktar",
      impConfirm: "Mevcut {cur} kayıt, yedek dosyasındaki {inc} kayıtla değiştirilecek. Devam edilsin mi?",
      impReplace: "Değiştir",
      editAria: "Düzenle: {name}",
      delAria: "Sil: {name}",
      searchAria: "Ürün ara",
      langAria: "Dil seçimi",
      nameReq: "Ürün adı gereklidir.",
      added: "Ürün eklendi.",
      updated: "Ürün güncellendi.",
      deleted: "Ürün silindi.",
      imported: "Yedek yüklendi: {n} kayıt içe aktarıldı.",
      exported: "Yedek dosyası indiriliyor\u2026",
      invalidFile: "Dosya okunamadı veya geçerli bir yedek dosyası değil.",
      storageWarn: "Uyarı: Tarayıcı depolamasına erişilemiyor. Verileriniz yalnızca bu oturum boyunca tutulacak ve sayfa kapatıldığında kaybolacaktır.",
      corruptWarn: "Kayıtlı veriler okunamadı; boş liste ile başlandı.",
      locMissingTitle: "Konum Eksik",
      locMissingMsg: "\u201C{name}\u201D için konum girilmedi. Konum olmadan devam edilsin mi?",
      dupExactTitle: "Ürün Zaten Mevcut",
      dupExactMsg: "\u201C{name}\u201D ürünü \u201C{location}\u201D konumunda zaten kayıtlı. Aynı ürünü iki kez ekleyemezsiniz.",
      dupWarnTitle: "Aynı Ürün, Farklı Konum",
      dupWarnMsg: "\u201C{name}\u201D ürünü zaten başka bir konumda kayıtlı. Yine de yeni kayıt olarak eklensin mi?",
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

