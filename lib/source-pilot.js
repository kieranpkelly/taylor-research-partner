const SOURCE_EDITIONS = {
  "iamblichus-de-mysteriis-parthey-1857": {
    id: "iamblichus-de-mysteriis-parthey-1857",
    workTitle: "Iamblichus, De Mysteriis",
    sourceLanguage: "Greek",
    ctsUrn: "urn:cts:greekLit:tlg2023.tlg006.1st1K-grc1",
    catalogUrn: "urn:cts:greekLit:tlg2023.tlg006.opp-grc1",
    editor: "Gustav Parthey",
    publication: "Jamblichi De mysteriis liber. Berlin: Nicolai, 1857.",
    repository: "OpenGreekAndLatin/First1KGreek",
    license: "Creative Commons Attribution-ShareAlike 4.0 International",
    repositoryUrl: "https://github.com/OpenGreekAndLatin/First1KGreek/blob/master/data/tlg2023/tlg006/tlg2023.tlg006.1st1K-grc1.xml",
    rawUrl: "https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg2023/tlg006/tlg2023.tlg006.1st1K-grc1.xml",
    scaifeUrl: "https://scaife.perseus.org/library/urn%3Acts%3AgreekLit%3Atlg2023.tlg006/"
  }
};

const SOURCE_WORKS = [
  {
    id: "iamblichus-on-the-mysteries",
    taylorFile: "17IAMBL.doc",
    taylorTitle: "Iamblichus, On the Mysteries",
    sourceTitle: "Iamblichus, De Mysteriis",
    language: "Greek",
    status: "Pilot alignment",
    note: "The first pilot maps selected Taylor passages to the OpenGreekAndLatin/Scaife Greek edition."
  }
];

const SOURCE_ALIGNMENTS = [
  {
    id: "iambl-sec1-hermes",
    passageId: "17iambl-0016",
    taylorFile: "17IAMBL.doc",
    title: "Hermes and Sacerdotal Science",
    sourceEditionId: "iamblichus-de-mysteriis-parthey-1857",
    sourceRef: "opening response, repository lines 12-16",
    sourceUrl: "https://github.com/OpenGreekAndLatin/First1KGreek/blob/master/data/tlg2023/tlg006/tlg2023.tlg006.1st1K-grc1.xml#L12-L16",
    confidence: "high",
    englishAnchors: [
      "Hermes, the God who presides over language",
      "true science concerning the Gods",
      "epistle sent to my disciple Anebo",
      "dismiss the consideration whether the speaker"
    ],
    sourceText: `Ἀβάμμωνος διδασκάλου πρὸς τὴν Πορφυρίου πρὸς Ἀνεβὼ ἐπιστολὴν ἀπόκρισις, καὶ τῶν ἐν αὐτῇ ἀπορημάτων λύσεις.

Θεὸς ὁ τῶν λόγων ἡγεμών, ὁ Ἑρμῆς, πάλαι δέδοκται καλῶς ἅπασι τοῖς ἱερεῦσιν εἶναι κοινός· ὁ καὶ τῆς περὶ θεῶν ἀληθινῆς ἐπιστήμης προεστηκὼς εἷς ἐστιν ὁ αὐτὸς ἐν ὅλοις· ᾧ δὴ καὶ οἱ ἡμέτεροι πρόγονοι· τὰ αὑτῶν τῆς σοφίας εὑρήματα ἀνετίθεσαν, Ἑρμοῦ πάντα τὰ οἰκεῖα συγγράμματα ἐπονομάζοντες.

εἰ καὶ τοῦδε τοῦ θεοῦ καὶ ἡμεῖς τὸ ἐπιβάλλον καὶ δυνατὸν ἑαυτοῖς μέρος μετάσχοιμεν, σύ τε καλῶς ποιεῖς, τινὰ εἰς γνῶσιν τοῖς ἱερεῦσιν, ὡς φιλοῦσι, περὶ θεολογίας προτείνων ἐρωτήματα, ἐγώ τε εἰκότως τὴν πρὸς Ἀνεβὼ τὸν ἐμὸν μαθητὴν πεμφθεῖσαν ἐπιστολὴν ἐμαυτῷ γεγράφθαι νομίσας ἀποκρινοῦμαί σοι αὐτὰ τ’ ἀληθῆ ὑπὲρ ὧν πυνθάνῃ.`,
    note: "Taylor renders τῶν λόγων ἡγεμών as the divine presidency over language and keeps the Egyptian-prophetic framing of the reply."
  },
  {
    id: "iambl-sec1-method",
    passageId: "17iambl-0017",
    taylorFile: "17IAMBL.doc",
    title: "Answering Each Inquiry in Its Proper Mode",
    sourceEditionId: "iamblichus-de-mysteriis-parthey-1857",
    sourceRef: "method statement, repository lines 21-23",
    sourceUrl: "https://github.com/OpenGreekAndLatin/First1KGreek/blob/master/data/tlg2023/tlg006/tlg2023.tlg006.1st1K-grc1.xml#L21-L23",
    confidence: "high",
    englishAnchors: [
      "peculiar dogmas of the Assyrians",
      "ancient pillars of Hermes",
      "theological, we shall answer theologically",
      "theurgic, theurgically",
      "philosophical"
    ],
    sourceText: `Ἡμεῖς οὖν περὶ τὰ μὲν Ἀσσυρίων πάτρια δόγματα παραδώσομέν σοι μετ’ ἀκριβείας καὶ ἀληθείας τὴν γνώμην, τὰ δὲ ἡμέτερά σοι σαφῶς ἀποκαλύψομεν, τὰ μὲν ἀπὸ τῶν ἀρχαίων ἀπείρων γραμμάτων ἀναλογιζόμενοι τῇ γνώσει, τὰ δ’ ἀφ’ ὧν ὕστερον εἰς πεπερασμένον βιβλίον συνήγαγον οἱ παλαιοὶ τὴν ὅλην περὶ τῶν θείων εἴδησιν.

Φιλόσοφον δ’ εἴ τι προβάλλεις ἐρώτημα, διακρινοῦμέν σοι καὶ τοῦτο κατὰ τὰς Ἑρμοῦ παλαιὰς στήλας, ἃς Πλάτων ἤδη πρόσθεν καὶ Πυθαγόρας διαναγνόντες φιλοσοφίαν συνεστήσαντο.

τὸ δ’ οἰκεῖον ἐπὶ πᾶσιν ἀποδώσομέν σοι προσηκόντως, καὶ τὰ μὲν θεολογικὰ θεολογικῶς, θεουργικὰ δὲ θεουργικῶς ἀποκρινούμεθα, φιλοσόφως δὲ τὰ φιλόσοφα μετὰ σοῦ συνεξετάσομεν.`,
    note: "This is a good test case for Taylor's technical adverbs: θεολογικῶς, θεουργικῶς, φιλοσόφως."
  },
  {
    id: "iambl-sec1-innate-knowledge",
    passageId: "17iambl-0017",
    taylorFile: "17IAMBL.doc",
    title: "Innate Knowledge of the Gods",
    sourceEditionId: "iamblichus-de-mysteriis-parthey-1857",
    sourceRef: "Book I opening argument, repository lines 24-30",
    sourceUrl: "https://github.com/OpenGreekAndLatin/First1KGreek/blob/master/data/tlg2023/tlg006/tlg2023.tlg006.1st1K-grc1.xml#L24-L30",
    confidence: "high",
    englishAnchors: [
      "innate knowledge of the Gods",
      "contact with divinity is not knowledge",
      "uniform connexion with divinity",
      "we are comprehended in it",
      "we are filled by it",
      "knowing the Gods"
    ],
    sourceText: `Φῆς τοίνυν πρῶτον διδόναι εἶναι θεούς. τὸ δ’ ἐστὶν οὐκ ὀρθὸν οὑτωσὶ λεγόμενον. συνυπάρχει γὰρ ἡμῶν αὐτῇ τῇ οὐσίᾳ ἡ περὶ θεῶν ἔμφυτος γνῶσις, κρίσεώς τε πάσης ἐστὶ κρείττων καὶ προαιρέσεως, λόγου τε καὶ ἀποδείξεως προϋπάρχει· συνήνωταί τε ἐξ ἀρχῆς πρὸς τὴν οἰκείαν αἰτίαν, καὶ τῇ πρὸς τἀγαθὸν οὐσιώδει τῆς ψυχῆς ἐφέσει συνυφέστηκεν.

Εἰ δὲ δεῖ τἀληθὲς εἰπεῖν οὐδὲ γνῶσίς ἐστιν ἡ πρὸς τὸ θεῖον συναφή· διείργεται γὰρ αὕτη πως ἑτερότητι. πρὸ δὲ τῆς ὡς ἑτέρας ἕτερον γιγνωσκούσης αὐτοφυής ἐστι καὶ ἀδιάκριτος ἡ τῶν θεῶν ἐξηρτημένη μονοειδὴς συμπλοκή.

περιεχόμεθα γὰρ ἐν αὐτῇ μᾶλλον ἡμεῖς καὶ πληρούμεθα ὑπ’ αὐτῆς, καὶ αὐτὸ ὅπέρ ἐσμεν ἐν τῷ τοὺς θεοὺς εἰδέναι ἔχομεν.`,
    note: "Taylor's 'innate knowledge' translates ἔμφυτος γνῶσις, while 'uniform connexion' reflects μονοειδὴς συμπλοκή."
  },
  {
    id: "iambl-sacred-symbols",
    passageId: "17iambl-0028",
    taylorFile: "17IAMBL.doc",
    title: "Sacred Rites as Symbols, Not Divine Passivity",
    sourceEditionId: "iamblichus-de-mysteriis-parthey-1857",
    sourceRef: "sacerdotal mysticism, repository lines 88-92",
    sourceUrl: "https://github.com/OpenGreekAndLatin/First1KGreek/blob/master/data/tlg2023/tlg006/tlg2023.tlg006.1st1K-grc1.xml#L88-L92",
    confidence: "high",
    englishAnchors: [
      "ignorance of sacerdotal mysticism",
      "arcane cause",
      "more excellent than reason",
      "as symbols",
      "purify and liberate",
      "impassive things to impassive"
    ],
    sourceText: `Πῶς οὖν πρὸς ἐμπαθεῖς αὐτοὺς πολλὰ δρᾶται ἐν ταῖς ἱερουργίαις; φημὶ δὴ οὖν καὶ τοῦτο ἀπείρως λέγεσθαι τῆς ἱερατικῆς μυσταγωγίας.

τῶν γὰρ ἐν τοῖς ἱεροῖς ἑκάστοτε ἐπιτελουμένων τὰ μὲν ἀπόρρητόν τινα καὶ κρείττονα λόγου τὴν αἰτίαν ἔχει· τὰ δ’ ὡς σύμβολα καθιέρωται ἐξ ἀιδίου τοῖς κρείττοσι· τὰ δ’ εἰκόνα τινὰ ἄλλην ἀποσώζει, καθάπερ δὴ καὶ ἡ γενεσιουργὸς φύσις τῶν ἀφανῶν λόγων ἐμφανεῖς τινὰς μορφώσεις ἀπετυπώσατο.

Κοινὴ μὲν οὖν ταῦθ’ ἡμῖν ἔστω παραμυθία περὶ τῆς ἀχράντων θρησκείας ὡς ἄλλως οἰκείως συναρμοζομένης τοῖς κρείττοσιν ἡμῶν, καὶ διότι καθαρὰ πρὸς καθαροὺς καὶ ἀπαθὴς πρὸς ἀπαθεῖς προσάγεται.`,
    note: "This is the first ritual-language alignment in the pilot and is useful for questions about σύμβολα and ἱερουργίαι."
  },
  {
    id: "iambl-invocations-ascent",
    passageId: "17iambl-0029",
    taylorFile: "17IAMBL.doc",
    title: "Invocation as Ascent Rather Than Descent",
    sourceEditionId: "iamblichus-de-mysteriis-parthey-1857",
    sourceRef: "invocation and ascent, repository lines 97-102",
    sourceUrl: "https://github.com/OpenGreekAndLatin/First1KGreek/blob/master/data/tlg2023/tlg006/tlg2023.tlg006.1st1K-grc1.xml#L97-L102",
    confidence: "high",
    englishAnchors: [
      "illumination which takes place through invocations",
      "calling upwards their souls",
      "union with themselves",
      "ascent through invocations",
      "liberation from generation",
      "renders the will of man adapted"
    ],
    sourceText: `Ἀλλὰ αἱ κλήσεις, φησίν, ὡς πρὸς ἐμπαθεῖς τοὺς θεοὺς γίγνονται, ὥστε οὐχ οἱ δαίμονες μόναν εἰσὶν ἐμπαθεῖς, ἀλλὰ καὶ οἱ θεοί. τὸ δὲ οὐχ οὕτως ἔχει καθάπερ ὑπείληφας. αὐτοφανὴς γάρ τίς ἐστι καὶ αὐτοτελὴς ἡ διὰ τῶν κλήσεων ἔλλαμψις, πόρρω τε τοῦ καθέλκεσθαι ἀφέστηκε, διὰ τῆς θείας τε ἐνεργείας καὶ τελειότητος πρόεισιν εἰς τὸ ἐμφανές.

διὰ τῆς τοιαύτης οὖν βουλήσεως ἀφθόνως οἱ θεοὶ τὸ φῶς ἐπιλάμπουσιν εὐμενεῖς ὄντες καὶ ἵλεῳ τοῖς θεουργοῖς, τάς τε ψυχὰς αὐτῶν εἰς ἑαυτοὺς ἀνακαλούμενοι καὶ τὴν ἕνωσιν αὐταῖς τὴν πρὸς ἑαυτοὺς χορηγοῦντες.

εἰ δὴ κάθαρσιν παθῶν καὶ ἀπαλλαγὴν γενέσεως ἕνωσίν τε πρὸς τὴν θείαν ἀρχὴν ἡ διὰ τῶν κλήσεων ἄνοδος παρέχει τοῖς ἱερεῦσι, τί δήποτε παθῶν τις αὐτῇ προσάπτει;`,
    note: "The key opposition is καθέλκεσθαι, drawing down, versus ἄνοδος, ascent."
  },
  {
    id: "iambl-pacification",
    passageId: "17iambl-0029",
    taylorFile: "17IAMBL.doc",
    title: "Pacification and the So-Called Anger of the Gods",
    sourceEditionId: "iamblichus-de-mysteriis-parthey-1857",
    sourceRef: "divine anger and pacification, repository lines 103-106",
    sourceUrl: "https://github.com/OpenGreekAndLatin/First1KGreek/blob/master/data/tlg2023/tlg006/tlg2023.tlg006.1st1K-grc1.xml#L103-L106",
    confidence: "high",
    englishAnchors: [
      "pacifications of anger",
      "anger of the Gods",
      "abandonment of the beneficent care",
      "convert us to the participation",
      "privation of good"
    ],
    sourceText: `Καὶ δὴ καὶ αἱ τῆς μήνιδος ἐξιλάσεις ἔσονται σαφεῖς, ἐὰν τὴν μῆνιν τῶν θεῶν καταμάθωμεν. αὕτη τοίνυν οὐχ, ὡς δοκεῖ τισί, παλαιά τίς ἐστε καὶ ἔμμονος ὀργή, ἀλλὰ τῆς ἀγαθουργοῦ κηδεμονίας περὶ θεῶν ἀποστροφή, ἣν αὐτοὶ ἑαυτοὺς ἀποστρέψαντες, ὥσπερ ἐν μεσημβρίᾳ φωτὸς κατακαλυψάμενοι, σκότος ἑαυτοῖς ἐπηγάγομεν καὶ ἀπεστερήσαμεν ἑαυτοὺς τῆς τῶν θεῶν ἀγαθῆς δόσεως.

δύναται οὖν ἡ ἐξίλασις ἡμᾶς ἐπιστρέψαι πρὸς τὴν κρείττονα μετουσίαν, καὶ τὴν ἀνεσταλμένην ἀφ’ ἡμῶν θείαν κηδεμονίαν εἰς κοινωνίαν προσαγαγεῖν, καὶ συνδῆσαι συμμέτρως τὰ μετεχόμενά τε καὶ μεταλαμβάνοντα πρὸς ἄλληλα.`,
    note: "Taylor's interpretation is explicit: divine anger is not passion in the gods, but human turning-away from beneficent providence."
  }
];

const SOURCE_LINKS_BY_PASSAGE = new Map();
for (const alignment of SOURCE_ALIGNMENTS) {
  const links = SOURCE_LINKS_BY_PASSAGE.get(alignment.passageId) ?? [];
  links.push(alignment);
  SOURCE_LINKS_BY_PASSAGE.set(alignment.passageId, links);
}

const SOURCE_PHRASES = [
  {
    id: "phrase-hermes-language",
    alignmentId: "iambl-sec1-hermes",
    passageId: "17iambl-0016",
    taylorText: "Hermes, the God who presides over language",
    sourceText: "Θεὸς ὁ τῶν λόγων ἡγεμών, ὁ Ἑρμῆς",
    confidence: "high",
    note: "Taylor takes λόγων in the broad sense of discourse, speech, or rational expression, hence 'language'."
  },
  {
    id: "phrase-true-science-gods",
    alignmentId: "iambl-sec1-hermes",
    passageId: "17iambl-0016",
    taylorText: "true science concerning the Gods",
    sourceText: "τῆς περὶ θεῶν ἀληθινῆς ἐπιστήμης",
    confidence: "high",
    note: "The central noun is ἐπιστήμη, a stable science or knowledge, qualified as true and concerning the gods."
  },
  {
    id: "phrase-epistle-anebo",
    alignmentId: "iambl-sec1-hermes",
    passageId: "17iambl-0016",
    taylorText: "the epistle sent to my disciple Anebo",
    sourceText: "τὴν πρὸς Ἀνεβὼ τὸν ἐμὸν μαθητὴν πεμφθεῖσαν ἐπιστολὴν",
    confidence: "high",
    note: "Taylor follows the Greek construction closely: the letter sent to Anebo, who is identified as 'my disciple'."
  },
  {
    id: "phrase-assyrian-dogmas",
    alignmentId: "iambl-sec1-method",
    passageId: "17iambl-0017",
    taylorText: "peculiar dogmas of the Assyrians",
    sourceText: "τὰ μὲν Ἀσσυρίων πάτρια δόγματα",
    confidence: "medium",
    note: "Taylor's 'peculiar' renders πάτρια, meaning ancestral or traditional, rather than private or eccentric."
  },
  {
    id: "phrase-accuracy-truth",
    alignmentId: "iambl-sec1-method",
    passageId: "17iambl-0017",
    taylorText: "with accuracy and truth",
    sourceText: "μετ’ ἀκριβείας καὶ ἀληθείας",
    confidence: "high",
    note: "A direct rendering of the paired nouns ἀκρίβεια and ἀλήθεια."
  },
  {
    id: "phrase-pillars-hermes",
    alignmentId: "iambl-sec1-method",
    passageId: "17iambl-0017",
    taylorText: "ancient pillars of Hermes",
    sourceText: "τὰς Ἑρμοῦ παλαιὰς στήλας",
    confidence: "high",
    note: "Taylor's 'pillars' corresponds to στήλας, stelae or inscribed pillars."
  },
  {
    id: "phrase-theological-theologically",
    alignmentId: "iambl-sec1-method",
    passageId: "17iambl-0017",
    taylorText: "theological, we shall answer theologically",
    sourceText: "τὰ μὲν θεολογικὰ θεολογικῶς ... ἀποκρινούμεθα",
    confidence: "high",
    note: "Taylor preserves the Greek play between the adjective θεολογικά and the adverb θεολογικῶς."
  },
  {
    id: "phrase-theurgic-theurgically",
    alignmentId: "iambl-sec1-method",
    passageId: "17iambl-0017",
    taylorText: "theurgic, theurgically",
    sourceText: "θεουργικὰ δὲ θεουργικῶς",
    confidence: "high",
    note: "The Greek keeps the distinction between the class of the question and the mode of answer."
  },
  {
    id: "phrase-philosophical-philosophically",
    alignmentId: "iambl-sec1-method",
    passageId: "17iambl-0017",
    taylorText: "philosophical",
    sourceText: "φιλοσόφως ... τὰ φιλόσοφα",
    confidence: "medium",
    note: "The Greek phrase pairs philosophical matters with a philosophical mode of examination."
  },
  {
    id: "phrase-innate-knowledge",
    alignmentId: "iambl-sec1-innate-knowledge",
    passageId: "17iambl-0017",
    taylorText: "innate knowledge of the Gods",
    sourceText: "ἡ περὶ θεῶν ἔμφυτος γνῶσις",
    confidence: "high",
    note: "Taylor's 'innate' is ἔμφυτος, literally implanted in or connate with our being."
  },
  {
    id: "phrase-superior-judgment-choice",
    alignmentId: "iambl-sec1-innate-knowledge",
    passageId: "17iambl-0017",
    taylorText: "superior to all judgment and deliberate choice",
    sourceText: "κρίσεώς τε πάσης ἐστὶ κρείττων καὶ προαιρέσεως",
    confidence: "high",
    note: "κρείττων marks this knowledge as prior or superior to discursive judgment and choice."
  },
  {
    id: "phrase-prior-reason-demonstration",
    alignmentId: "iambl-sec1-innate-knowledge",
    passageId: "17iambl-0017",
    taylorText: "prior to reason and demonstration",
    sourceText: "λόγου τε καὶ ἀποδείξεως προϋπάρχει",
    confidence: "high",
    note: "Taylor's 'prior' corresponds to προϋπάρχει, 'pre-exists' or 'exists beforehand'."
  },
  {
    id: "phrase-contact-divinity",
    alignmentId: "iambl-sec1-innate-knowledge",
    passageId: "17iambl-0017",
    taylorText: "contact with divinity is not knowledge",
    sourceText: "οὐδὲ γνῶσίς ἐστιν ἡ πρὸς τὸ θεῖον συναφή",
    confidence: "high",
    note: "The key term is συναφή, contact or conjunction, which Taylor contrasts with ordinary knowledge."
  },
  {
    id: "phrase-uniform-connexion",
    alignmentId: "iambl-sec1-innate-knowledge",
    passageId: "17iambl-0017",
    taylorText: "uniform connexion with divinity",
    sourceText: "ἡ τῶν θεῶν ἐξηρτημένη μονοειδὴς συμπλοκή",
    confidence: "medium",
    note: "Taylor's 'uniform connexion' compresses μονοειδὴς συμπλοκή, a single-formed or unitary interweaving."
  },
  {
    id: "phrase-comprehended-in-it",
    alignmentId: "iambl-sec1-innate-knowledge",
    passageId: "17iambl-0017",
    taylorText: "we are comprehended in it",
    sourceText: "περιεχόμεθα γὰρ ἐν αὐτῇ",
    confidence: "high",
    note: "Taylor's 'comprehended' means held or contained, matching περιεχόμεθα."
  },
  {
    id: "phrase-filled-by-it",
    alignmentId: "iambl-sec1-innate-knowledge",
    passageId: "17iambl-0017",
    taylorText: "we are filled by it",
    sourceText: "πληρούμεθα ὑπ’ αὐτῆς",
    confidence: "high",
    note: "A direct rendering of the passive verb πληρούμεθα."
  },
  {
    id: "phrase-knowing-gods",
    alignmentId: "iambl-sec1-innate-knowledge",
    passageId: "17iambl-0017",
    taylorText: "knowing the Gods",
    sourceText: "ἐν τῷ τοὺς θεοὺς εἰδέναι",
    confidence: "high",
    note: "Taylor treats εἰδέναι as a condition of what we are, not merely an acquired act of knowing."
  },
  {
    id: "phrase-sacerdotal-mysticism",
    alignmentId: "iambl-sacred-symbols",
    passageId: "17iambl-0028",
    taylorText: "sacerdotal mysticism",
    sourceText: "τῆς ἱερατικῆς μυσταγωγίας",
    confidence: "high",
    note: "μυσταγωγία suggests initiatory guidance; Taylor's 'sacerdotal mysticism' emphasizes the priestly register."
  },
  {
    id: "phrase-arcane-cause",
    alignmentId: "iambl-sacred-symbols",
    passageId: "17iambl-0028",
    taylorText: "arcane cause",
    sourceText: "ἀπόρρητόν τινα ... τὴν αἰτίαν",
    confidence: "medium",
    note: "ἀπόρρητον means unspeakable, secret, or not to be disclosed; Taylor chooses 'arcane'."
  },
  {
    id: "phrase-more-excellent-reason",
    alignmentId: "iambl-sacred-symbols",
    passageId: "17iambl-0028",
    taylorText: "more excellent than reason",
    sourceText: "κρείττονα λόγου",
    confidence: "high",
    note: "Taylor's phrase marks a cause above λόγος, not merely a reason stronger than another reason."
  },
  {
    id: "phrase-as-symbols",
    alignmentId: "iambl-sacred-symbols",
    passageId: "17iambl-0028",
    taylorText: "as symbols",
    sourceText: "ὡς σύμβολα",
    confidence: "high",
    note: "A compact and direct equivalent."
  },
  {
    id: "phrase-impassive-to-impassive",
    alignmentId: "iambl-sacred-symbols",
    passageId: "17iambl-0028",
    taylorText: "impassive to impassive",
    sourceText: "ἀπαθὴς πρὸς ἀπαθεῖς",
    confidence: "high",
    note: "Taylor preserves the repeated ἀπαθ- root to deny passion in the divine relation."
  },
  {
    id: "phrase-invocations",
    alignmentId: "iambl-invocations-ascent",
    passageId: "17iambl-0029",
    taylorText: "invocations",
    sourceText: "αἱ κλήσεις",
    confidence: "medium",
    note: "κλήσεις are callings or invocations; Taylor uses the ritual term."
  },
  {
    id: "phrase-illumination-invocations",
    alignmentId: "iambl-invocations-ascent",
    passageId: "17iambl-0029",
    taylorText: "illumination which takes place through invocations",
    sourceText: "ἡ διὰ τῶν κλήσεων ἔλλαμψις",
    confidence: "high",
    note: "ἔλλαμψις is illumination or shining-in, mediated through the invocations."
  },
  {
    id: "phrase-drawing-down",
    alignmentId: "iambl-invocations-ascent",
    passageId: "17iambl-0029",
    taylorText: "drawing down",
    sourceText: "καθέλκεσθαι",
    confidence: "high",
    note: "Taylor's contrast depends on denying καθέλκεσθαι, the drawing-down of the gods."
  },
  {
    id: "phrase-calling-upwards-souls",
    alignmentId: "iambl-invocations-ascent",
    passageId: "17iambl-0029",
    taylorText: "calling upwards their souls",
    sourceText: "τάς τε ψυχὰς αὐτῶν εἰς ἑαυτοὺς ἀνακαλούμενοι",
    confidence: "medium",
    note: "ἀνακαλούμενοι is a calling back or calling upward; Taylor interprets the direction theurgically."
  },
  {
    id: "phrase-union-with-themselves",
    alignmentId: "iambl-invocations-ascent",
    passageId: "17iambl-0029",
    taylorText: "union with themselves",
    sourceText: "τὴν ἕνωσιν ... πρὸς ἑαυτοὺς",
    confidence: "high",
    note: "ἕνωσις is Taylor's familiar 'union', here oriented toward the gods themselves."
  },
  {
    id: "phrase-ascent-invocations",
    alignmentId: "iambl-invocations-ascent",
    passageId: "17iambl-0029",
    taylorText: "ascent through invocations",
    sourceText: "ἡ διὰ τῶν κλήσεων ἄνοδος",
    confidence: "high",
    note: "ἄνοδος supplies the decisive upward motion against the idea of drawing gods down."
  },
  {
    id: "phrase-liberation-generation",
    alignmentId: "iambl-invocations-ascent",
    passageId: "17iambl-0029",
    taylorText: "liberation from generation",
    sourceText: "ἀπαλλαγὴν γενέσεως",
    confidence: "high",
    note: "Taylor's 'generation' renders γένεσις, the realm or process of becoming."
  },
  {
    id: "phrase-pacifications-anger",
    alignmentId: "iambl-pacification",
    passageId: "17iambl-0029",
    taylorText: "pacifications of anger",
    sourceText: "αἱ τῆς μήνιδος ἐξιλάσεις",
    confidence: "high",
    note: "ἐξιλάσεις are appeasements or propitiations; μήνις is a solemn word for wrath."
  },
  {
    id: "phrase-anger-gods",
    alignmentId: "iambl-pacification",
    passageId: "17iambl-0029",
    taylorText: "anger of the Gods",
    sourceText: "τὴν μῆνιν τῶν θεῶν",
    confidence: "high",
    note: "The passage immediately reinterprets this 'anger' as human privation or turning away, not divine passion."
  },
  {
    id: "phrase-beneficent-care",
    alignmentId: "iambl-pacification",
    passageId: "17iambl-0029",
    taylorText: "beneficent care",
    sourceText: "ἀγαθουργοῦ κηδεμονίας",
    confidence: "medium",
    note: "ἀγαθουργός means good-working or beneficent; κηδεμονία is care or guardianship."
  },
  {
    id: "phrase-abandonment-care",
    alignmentId: "iambl-pacification",
    passageId: "17iambl-0029",
    taylorText: "abandonment of the beneficent care",
    sourceText: "τῆς ἀγαθουργοῦ κηδεμονίας ... ἀποστροφή",
    confidence: "medium",
    note: "Taylor construes ἀποστροφή as an abandonment or turning-away from divine care."
  },
  {
    id: "phrase-participation",
    alignmentId: "iambl-pacification",
    passageId: "17iambl-0029",
    taylorText: "participation",
    sourceText: "μετουσίαν",
    confidence: "medium",
    note: "μετουσία is participation or sharing-in, a term Taylor often renders with technical Platonist force."
  },
  {
    id: "phrase-privation-good",
    alignmentId: "iambl-pacification",
    passageId: "17iambl-0029",
    taylorText: "privation of good",
    sourceText: "ἀπεστερήσαμεν ἑαυτοὺς τῆς τῶν θεῶν ἀγαθῆς δόσεως",
    confidence: "medium",
    note: "The Greek says we deprive ourselves of the gods' good gift; Taylor frames this as privation."
  }
];

const SOURCE_PHRASES_BY_PASSAGE = new Map();
for (const phrase of SOURCE_PHRASES) {
  const phrases = SOURCE_PHRASES_BY_PASSAGE.get(phrase.passageId) ?? [];
  phrases.push(phrase);
  SOURCE_PHRASES_BY_PASSAGE.set(phrase.passageId, phrases);
}

export function getSourcePilotStatus() {
  return {
    enabled: true,
    workCount: SOURCE_WORKS.length,
    alignmentCount: SOURCE_ALIGNMENTS.length,
    phraseCount: SOURCE_PHRASES.length,
    works: SOURCE_WORKS
  };
}

export function getSourceLinksForPassage(passageId) {
  return (SOURCE_LINKS_BY_PASSAGE.get(String(passageId)) ?? []).map(toPublicAlignment);
}

export function getSourceWorkForTaylorFile(fileName) {
  const normalized = String(fileName ?? "").toLowerCase();
  return SOURCE_WORKS.find((work) => work.taylorFile.toLowerCase() === normalized) ?? null;
}

export function enrichSourcesWithSourceLinks(sources) {
  return sources.map((source) => {
    const links = SOURCE_LINKS_BY_PASSAGE.get(source.id) ?? [];
    const languages = [...new Set(links.map((link) => SOURCE_EDITIONS[link.sourceEditionId]?.sourceLanguage).filter(Boolean))];
    return {
      ...source,
      sourceAlignmentCount: links.length,
      sourceLanguages: languages
    };
  });
}

export function sourceLinksForResults(results, options = {}) {
  const maxPassages = options.maxPassages ?? 6;
  const maxLinks = options.maxLinks ?? 12;
  const links = [];
  const seenPassages = new Set();

  for (const result of results) {
    if (seenPassages.size >= maxPassages) break;
    const passageLinks = SOURCE_LINKS_BY_PASSAGE.get(result.id) ?? [];
    if (!passageLinks.length) continue;
    seenPassages.add(result.id);
    links.push(...passageLinks);
    if (links.length >= maxLinks) break;
  }

  return links.slice(0, maxLinks).map(toPublicAlignment);
}

export function lookupSourcePhrase({ selectedText, passageId, limit = 5 } = {}) {
  const selected = normalizeForMatching(selectedText);
  if (!selected) return [];

  const candidates = passageId
    ? SOURCE_PHRASES.filter((phrase) => phrase.passageId === passageId)
    : SOURCE_PHRASES;
  const selectedTokens = significantTokens(selected);
  if (!selectedTokens.length) return [];

  const ranked = candidates
    .map((phrase) => {
      const alignment = SOURCE_ALIGNMENTS.find((item) => item.id === phrase.alignmentId);
      if (!alignment) return null;
      const score = scorePhraseMatch(selected, selectedTokens, phrase);
      if (score <= 0) return null;
      const edition = SOURCE_EDITIONS[alignment.sourceEditionId];
      return {
        ...phrase,
        score,
        matchConfidence: confidenceForScore(score, phrase.confidence),
        alignmentTitle: alignment.title,
        sourceRef: alignment.sourceRef,
        sourceUrl: alignment.sourceUrl,
        sourceEdition: edition
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  const bestScore = ranked[0]?.score ?? 0;
  const filtered = bestScore >= 55
    ? ranked.filter((match) => match.score >= Math.max(38, bestScore * 0.55))
    : ranked;
  return filtered.slice(0, limit);
}

export function formatSourceLinksForPrompt(links, options = {}) {
  if (!links.length) return "No original-language pilot alignments were retrieved.";
  const maxChars = options.maxChars ?? 1200;
  return links
    .map((link, index) => {
      const edition = link.sourceEdition;
      return [
        `Original-language alignment ${index + 1}: [source-text:${link.id}]`,
        `Taylor passage: [[source:${link.passageId}]]`,
        `Alignment title: ${link.title}`,
        `Source edition: ${edition.workTitle}; ${edition.editor}; ${edition.publication}`,
        `Source reference: ${link.sourceRef}`,
        `Confidence: ${link.confidence}`,
        `Taylor anchors: ${link.englishAnchors.join("; ")}`,
        `Greek source: """${clip(link.sourceText, maxChars)}"""`,
        `Translator note: ${link.note}`
      ].join("\n");
    })
    .join("\n\n");
}

function toPublicAlignment(alignment) {
  const edition = SOURCE_EDITIONS[alignment.sourceEditionId];
  return {
    ...alignment,
    phraseCount: SOURCE_PHRASES_BY_PASSAGE.get(alignment.passageId)?.filter((phrase) => phrase.alignmentId === alignment.id).length ?? 0,
    sourceEdition: edition
  };
}

function clip(text, maxChars) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trim()}...`;
}

function scorePhraseMatch(selected, selectedTokens, phrase) {
  const candidate = normalizeForMatching(phrase.taylorText);
  if (!candidate) return 0;
  const candidateTokens = significantTokens(candidate);
  if (!candidateTokens.length) return 0;

  if (selected === candidate) return 100;
  if (selected.includes(candidate)) return 85 + Math.min(candidateTokens.length, 8);
  if (candidate.includes(selected) && selected.length >= 4) return 68 + Math.min(selectedTokens.length, 6);

  const selectedSet = new Set(selectedTokens);
  const candidateSet = new Set(candidateTokens);
  const overlap = candidateTokens.filter((token) => selectedSet.has(token)).length;
  if (!overlap) return 0;

  const coverageOfCandidate = overlap / candidateSet.size;
  const coverageOfSelection = overlap / selectedSet.size;
  const score = Math.round(55 * coverageOfCandidate + 35 * coverageOfSelection);
  return score >= 24 ? score : 0;
}

function confidenceForScore(score, baseConfidence) {
  if (score >= 80) return baseConfidence;
  if (score >= 55) return baseConfidence === "high" ? "medium" : baseConfidence;
  return "low";
}

function normalizeForMatching(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function significantTokens(value) {
  return normalizeForMatching(value)
    .split(" ")
    .filter((token) => token.length > 2 && !COMMON_WORDS.has(token));
}

const COMMON_WORDS = new Set([
  "and",
  "are",
  "for",
  "from",
  "not",
  "the",
  "their",
  "them",
  "this",
  "that",
  "with",
  "which",
  "who",
  "was",
  "were",
  "shall",
  "through",
  "into",
  "its",
  "itself",
  "all",
  "our",
  "you",
  "what",
  "greek",
  "latin",
  "underlies",
  "underlying",
  "taylor",
  "phrase",
  "word",
  "words",
  "original",
  "source",
  "likely"
]);
