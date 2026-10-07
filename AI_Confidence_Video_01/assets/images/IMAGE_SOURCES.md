# Image sources: "Why AI Sounds Right When It's Wrong"

Researched 2026-10-07. The machine-readable record is `assets/asset_manifest.csv`. Raw download copies and the official metadata records (JSON) are in `assets/downloads/smithsonian_oa/`.

## Recommended images (all CC0, original resolution, not upscaled)

| # | File (assets/images/) | Subject | Pixels | License (as published) | Narrative use |
|---|---|---|---|---|---|
| IMG01 | `test_workbook_sharps_language_drills_and_tests_1929_nmaahc.jpg` | Cover of "Sharp's Language Drills and Tests: Fifth Grade" school workbook, 1929 (NMAAHC 2014.17.3) | 3857x5812 (portrait) | Media usage `CC0`. Rights: "Public domain" / "Proper usage is the responsibility of the user." | Real-world establishing shot for the test-scoring analogy, shown before the animated bubble-sheet "guess vs leave blank" sequence |
| IMG02 | `library_usnm_library_librarian_at_desk_1880s_sia.jpg` | U.S. National Museum Library, 1880s, librarian John Murdoch at his desk (SIA MAH-3666) | 6687x5425 | Media usage `CC0`. Rights: "No Copyright - United States" | The "check the actual record" beat: a person consulting the sources |
| IMG03 | `library_stacks_smithsonian_castle_c1912_sia.jpg` | Library stacks, Lower Main Hall balcony, Smithsonian Castle, c.1912-13 (SIA_000095_B31_F38_002) | 5774x4713 | Media usage `CC0`. Rights: "No Copyright - United States" | Wide plate of the stacks with no people, for text overlays and transitions |

Alternate (downloaded, not copied here): `assets/downloads/smithsonian_oa/SIA-SIA_000095_B41_F09_037.jpg`. It is a 1927 "book tower" of Smithsonian publications in the Castle library (4758x6000, portrait, CC0, photographer Arthur J. Olmsted). It can replace IMG03 if a vertical pan works better.

No attribution is legally required (CC0). The manifest gives an optional courtesy credit for each image, taken from the record's "Cite as" or "Credit Line" field.

### How the rights were verified
- Source: the **Smithsonian Open Access** dataset, public bucket `smithsonian-open-access` (AWS Open Data, us-west-2). It contains the official EDAN metadata records (`metadata/edan/<unit>/*.txt`) and the full-resolution media (`media/<unit>/<idsId>.jpg`).
- For each chosen image, the full EDAN record was pulled from that bucket and saved as `assets/downloads/smithsonian_oa/records/*.edan.json`. Each record has `online_media.media[].usage.access = "CC0"` and `metadata_usage.access = "CC0"`, plus the human-readable rights line quoted above.
- The downloaded pixel dimensions match the "High-resolution JPEG" dimensions stated in each record.
- Caveat: the public web pages (siarchives.si.edu, nmaahc.si.edu, collections.si.edu, ids.si.edu) are blocked by this sandbox's egress policy, so they could not be opened. The licence was checked against the Smithsonian's own published dataset record, not a search summary. Before publishing, it is worth one click on each source_url to confirm the page still shows CC0.

### Handling notes
- **IMG01:** the cover carries the 1929 pupil's handwritten name (Emery Crawford), school and date. This is a historical public museum record and not a sensitive context, but you can crop to the title block if you prefer. The object comes from NMAAHC's "Making a Way Out of No Way" exhibition. Use it respectfully as a period test booklet, and do not tie "wrong answer" jokes to the student. The cover's printed "Copyright 1928" is consistent with the museum's "Public domain" statement, because US works published in 1928 entered the public domain on 1 Jan 2024. The image is portrait; a full-width 16:9 crop is 3857x2170.
- **IMG02:** this is a glass-negative scan with plate edges and a handwritten "3666" at lower left, so crop it. A 16:9 crop of up to 6687x3761 is enough for 4K. John Murdoch (1852-1925) is a public historical figure.
- **IMG03:** crop out the black scanner border and the print margin. A 16:9 crop of about 5400x3040 is possible.
- None of the images has a watermark.

## Candidates considered and rejected

### Sources that could not be reached (egress policy: CONNECT 403, tested with curl)
These were not evaluated because they could not be reached:
- Wikimedia Commons / upload.wikimedia.org, Flickr, Unsplash, Pexels, Pixabay, StockSnap, Burst, rawpixel, Openverse
- Library of Congress (www/tile/cdn), Internet Archive, NYPL (digital collections, IIIF, API), DPLA, Europeana, Calisphere, Digital Commonwealth, Trove/NLA, DigitalNZ, Finna, Nationaal Archief
- The Met (API and images), Art Institute of Chicago (API and IIIF), Cleveland Museum of Art (API and CDN), National Gallery of Art (API and media), Rijksmuseum (incl. lh3.googleusercontent.com), Getty, Yale, Brooklyn, Walters, Paris Musées, SMK, Wellcome IIIF
- US federal sites: NARA catalog, DVIDS, defense.gov / media.defense.gov, army/navy/af/marines.mil, ed.gov, nist.gov, energy.gov, nps.gov, cdc.gov, nih.gov/nlm, usgs.gov, si.edu web pages, ids.si.edu
- WebFetch goes through the same egress policy (commons.wikimedia.org was blocked there too).

### Reachable sources that were rejected
- **NARA catalog on AWS** (`nara-national-archives-catalog` bucket): the metadata can be read, but the linked digital objects (`NARAprodstorage` on S3) return S3 `AccessDenied`. Nothing could be downloaded.
- **Google Open Images** (`open-images-dataset` S3 and `storage.googleapis.com/openimages`): reachable and labelled CC BY 2.0 in the dataset metadata. Rejected because (1) the hosted copies are capped at about 1024 px (the test image was 1024x768), (2) the Flickr source pages cannot be opened to verify each licence, and (3) the validation split had no usable Library, Classroom or Test images, only typewriters.

### Smithsonian Open Access items reviewed and not chosen
Scanned for exam, test, answer-sheet, classroom, library, card-catalog, dissertation and typewriter terms: SIA, NMAH, NMAAHC, NASM, NASM Archives, NPM, SAAM, Cooper Hewitt, HMSG, NPG, FSG, AAA, EEPA, SIL, SIL trade literature, NMNH education and others.
- **No CC0 photograph of students taking an exam, a multiple-choice or bubble answer sheet, or a card catalog exists in the Open Access image set.** The NMAH IBM 805 Test Scoring Machine and related answer sheets are not in it. Recommendation: build the bubble sheet itself as a motion graphic (it has to be animated anyway to show "guess vs blank" scoring) and use IMG01 as the real-world anchor.
- `siris_arc_403358`: cyanotype print of the same stacks view as IMG03. Rejected because of the heavy blue cast; the gelatin-silver version was chosen instead.
- `siris_arc_403359` / `403360`: construction of steel bookstacks, 1914. Off-message (a building site, not a library in use).
- `siris_arc_403193` / `403195` / `403196`: 1857 woodcut views of the Castle library and reading room (1950s copy photos). These are engravings, not photographs, and are less convincing as "the real record".
- `siris_arc_401615` / `401624` / `401627` / `403356`: other views of the 1927 library exhibit. The book-tower view (401626) was kept as the alternate.
- `nmah_660272`: Alejandro Ramos's examination paper, Manila, c.1900. CC0, but the Open Access set has only a screen-size image (no high-res), and its colonial-history context would distract from the narrative.
- NMAAHC 2014.17.3 second image (`..._3002`): the blank back cover. Downloaded, then deleted.
- `siris_sil_238120` and `siris_sil_789040`: 18th-century Uppsala printed dissertations (CC0 metadata). The page scans are hosted on BHL/archive.org, which is blocked, and the Open Access bucket has no high-res file for them.
- Typewriters (optional subject c): NMAH patent models (e.g. `nmah_850001` Crandall, `nmah_998196` Underwood Model 5) and NMAAHC personal typewriters (e.g. `nmaahc_2013.238.3`) are CC0 and high-res, but were not downloaded. The patent models do not serve the narrative, and the NMAAHC items are personal memorial objects. If a typewriter shot is wanted later, `nmah_998196` (5440x4080) is the cleanest option.
- Cooper Hewitt `chndm_1962-94-10` ("Mr. Herrick Teaching...", a wood engraving of a classroom). It shows an art class, not a test.
