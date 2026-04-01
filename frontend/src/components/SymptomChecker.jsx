import { useState, useRef, useEffect } from "react";
import "./styles/SymptomChecker.css";

const SymptomChecker = () => {
  // Adaptive question flow definition with ALL 132 symptoms
  const allQuestions = {
    // Category: FEVER & TEMPERATURE SYMPTOMS (Initial screening)
    high_fever: {
      id: "high_fever",
      question: "Do you have a high fever or elevated temperature?",
      symptom: "high_fever",
      followUps: ["chills", "sweating", "dehydration", "fatigue"],
    },
    mild_fever: {
      id: "mild_fever",
      question: "Do you have a mild or low-grade fever?",
      symptom: "mild_fever",
      followUps: ["fatigue", "headache"],
    },

    // Category: RESPIRATORY SYMPTOMS (Initial screening)
    cough: {
      id: "cough",
      question: "Are you experiencing a cough?",
      symptom: "cough",
      followUps: [
        "phlegm",
        "throat_irritation",
        "chest_pain",
        "breathlessness",
      ],
    },
    breathlessness: {
      id: "breathlessness",
      question: "Do you have shortness of breath or difficulty breathing?",
      symptom: "breathlessness",
      followUps: ["chest_pain", "fast_heart_rate", "weakness_in_limbs"],
    },
    throat_irritation: {
      id: "throat_irritation",
      question: "Do you have a sore or irritated throat?",
      symptom: "throat_irritation",
      followUps: ["patches_in_throat"],
    },
    phlegm: {
      id: "phlegm",
      question: "Are you coughing up phlegm or mucus?",
      symptom: "phlegm",
      followUps: ["mucoid_sputum", "rusty_sputum"],
    },
    congestion: {
      id: "congestion",
      question: "Do you have nasal congestion or stuffy nose?",
      symptom: "congestion",
      followUps: ["runny_nose", "sinus_pressure"],
    },
    runny_nose: {
      id: "runny_nose",
      question: "Do you have a runny nose or nasal discharge?",
      symptom: "runny_nose",
      followUps: ["continuous_sneezing"],
    },
    continuous_sneezing: {
      id: "continuous_sneezing",
      question: "Are you experiencing continuous sneezing?",
      symptom: "continuous_sneezing",
      followUps: [],
    },
    sinus_pressure: {
      id: "sinus_pressure",
      question: "Do you feel sinus pressure or pain?",
      symptom: "sinus_pressure",
      followUps: ["pain_behind_the_eyes"],
    },

    // Category: GASTROINTESTINAL SYMPTOMS (Initial screening)
    nausea: {
      id: "nausea",
      question: "Are you experiencing nausea?",
      symptom: "nausea",
      followUps: ["vomiting", "stomach_pain", "loss_of_appetite"],
    },
    vomiting: {
      id: "vomiting",
      question: "Are you vomiting or have you vomited?",
      symptom: "vomiting",
      followUps: ["stomach_pain", "dehydration", "bloody_stool"],
    },
    stomach_pain: {
      id: "stomach_pain",
      question: "Do you have stomach or abdominal pain?",
      symptom: "stomach_pain",
      followUps: ["acidity", "constipation", "diarrhoea"],
    },
    abdominal_pain: {
      id: "abdominal_pain",
      question: "Do you experience abdominal pain?",
      symptom: "abdominal_pain",
      followUps: ["distention_of_abdomen", "fluid_overload"],
    },
    belly_pain: {
      id: "belly_pain",
      question: "Do you have belly pain?",
      symptom: "belly_pain",
      followUps: ["vomiting"],
    },
    diarrhoea: {
      id: "diarrhoea",
      question: "Do you have diarrhea or loose stools?",
      symptom: "diarrhoea",
      followUps: ["bloody_stool", "pain_during_bowel_movements", "dehydration"],
    },
    constipation: {
      id: "constipation",
      question: "Are you experiencing constipation?",
      symptom: "constipation",
      followUps: ["pain_during_bowel_movements"],
    },
    acidity: {
      id: "acidity",
      question: "Are you experiencing acidity or acid reflux?",
      symptom: "acidity",
      followUps: ["indigestion", "vomiting"],
    },
    indigestion: {
      id: "indigestion",
      question: "Do you have indigestion or upset stomach?",
      symptom: "indigestion",
      followUps: ["stomach_pain"],
    },
    loss_of_appetite: {
      id: "loss_of_appetite",
      question: "Have you lost your appetite?",
      symptom: "loss_of_appetite",
      followUps: ["weight_loss", "fatigue"],
    },
    increased_appetite: {
      id: "increased_appetite",
      question: "Do you have an increased appetite?",
      symptom: "increased_appetite",
      followUps: ["weight_gain"],
    },
    bloody_stool: {
      id: "bloody_stool",
      question: "Do you have blood in your stool?",
      symptom: "bloody_stool",
      followUps: ["pain_in_anal_region", "stomach_bleeding"],
    },
    pain_during_bowel_movements: {
      id: "pain_during_bowel_movements",
      question: "Do you experience pain during bowel movements?",
      symptom: "pain_during_bowel_movements",
      followUps: ["irritation_in_anus"],
    },
    pain_in_anal_region: {
      id: "pain_in_anal_region",
      question: "Do you have pain in the anal region?",
      symptom: "pain_in_anal_region",
      followUps: [],
    },
    irritation_in_anus: {
      id: "irritation_in_anus",
      question: "Do you experience anal irritation?",
      symptom: "irritation_in_anus",
      followUps: [],
    },

    // Category: SKIN SYMPTOMS (Initial screening)
    skin_rash: {
      id: "skin_rash",
      question: "Do you have a skin rash?",
      symptom: "skin_rash",
      followUps: ["itching", "nodal_skin_eruptions", "red_spots_over_body"],
    },
    itching: {
      id: "itching",
      question: "Are you experiencing itching?",
      symptom: "itching",
      followUps: ["skin_peeling", "scurring"],
    },
    nodal_skin_eruptions: {
      id: "nodal_skin_eruptions",
      question: "Do you have nodular skin eruptions?",
      symptom: "nodal_skin_eruptions",
      followUps: [],
    },
    red_spots_over_body: {
      id: "red_spots_over_body",
      question: "Do you have red spots on your body?",
      symptom: "red_spots_over_body",
      followUps: [],
    },
    skin_peeling: {
      id: "skin_peeling",
      question: "Is your skin peeling?",
      symptom: "skin_peeling",
      followUps: [],
    },
    scurring: {
      id: "scurring",
      question: "Do you have scaling or scurring on the skin?",
      symptom: "scurring",
      followUps: [],
    },
    blister: {
      id: "blister",
      question: "Do you have blisters?",
      symptom: "blister",
      followUps: [],
    },
    pus_filled_pimples: {
      id: "pus_filled_pimples",
      question: "Do you have pus-filled pimples?",
      symptom: "pus_filled_pimples",
      followUps: ["blackheads"],
    },
    blackheads: {
      id: "blackheads",
      question: "Do you have blackheads?",
      symptom: "blackheads",
      followUps: [],
    },
    redness_of_eyes: {
      id: "redness_of_eyes",
      question: "Do your eyes have redness or irritation?",
      symptom: "redness_of_eyes",
      followUps: ["watering_from_eyes"],
    },
    watering_from_eyes: {
      id: "watering_from_eyes",
      question: "Do your eyes water excessively?",
      symptom: "watering_from_eyes",
      followUps: [],
    },
    blurred_and_distorted_vision: {
      id: "blurred_and_distorted_vision",
      question: "Do you have blurred or distorted vision?",
      symptom: "blurred_and_distorted_vision",
      followUps: ["visual_disturbances", "loss_of_balance"],
    },
    visual_disturbances: {
      id: "visual_disturbances",
      question: "Are you experiencing visual disturbances?",
      symptom: "visual_disturbances",
      followUps: [],
    },
    dischromic__patches: {
      id: "dischromic__patches",
      question: "Do you have discolored patches on your skin?",
      symptom: "dischromic _patches",
      followUps: [],
    },
    silver_like_dusting: {
      id: "silver_like_dusting",
      question: "Do you have silver-like dusting on the skin?",
      symptom: "silver_like_dusting",
      followUps: [],
    },
    red_sore_around_nose: {
      id: "red_sore_around_nose",
      question: "Do you have a red sore around your nose?",
      symptom: "red_sore_around_nose",
      followUps: ["yellow_crust_ooze"],
    },
    yellow_crust_ooze: {
      id: "yellow_crust_ooze",
      question: "Do you have yellow crusting or oozing?",
      symptom: "yellow_crust_ooze",
      followUps: [],
    },

    // Category: PAIN & MUSCULOSKELETAL SYMPTOMS (Initial screening)
    headache: {
      id: "headache",
      question: "Do you have a headache?",
      symptom: "headache",
      followUps: ["pain_behind_the_eyes", "dizziness"],
    },
    pain_behind_the_eyes: {
      id: "pain_behind_the_eyes",
      question: "Do you experience pain behind the eyes?",
      symptom: "pain_behind_the_eyes",
      followUps: [],
    },
    joint_pain: {
      id: "joint_pain",
      question: "Do you have joint pain?",
      symptom: "joint_pain",
      followUps: ["muscle_pain", "swelling_joints"],
    },
    muscle_pain: {
      id: "muscle_pain",
      question: "Do you have muscle pain or aches?",
      symptom: "muscle_pain",
      followUps: ["muscle_weakness", "muscle_wasting"],
    },
    muscle_weakness: {
      id: "muscle_weakness",
      question: "Are you experiencing muscle weakness?",
      symptom: "muscle_weakness",
      followUps: ["weakness_in_limbs", "fatigue"],
    },
    muscle_wasting: {
      id: "muscle_wasting",
      question: "Are you experiencing muscle wasting?",
      symptom: "muscle_wasting",
      followUps: [],
    },
    back_pain: {
      id: "back_pain",
      question: "Do you have back pain?",
      symptom: "back_pain",
      followUps: ["neck_pain", "movement_stiffness"],
    },
    neck_pain: {
      id: "neck_pain",
      question: "Do you have neck pain or stiffness?",
      symptom: "neck_pain",
      followUps: ["stiff_neck"],
    },
    stiff_neck: {
      id: "stiff_neck",
      question: "Do you have a stiff neck?",
      symptom: "stiff_neck",
      followUps: ["headache"],
    },
    knee_pain: {
      id: "knee_pain",
      question: "Do you have knee pain?",
      symptom: "knee_pain",
      followUps: ["painful_walking", "bruising"],
    },
    hip_joint_pain: {
      id: "hip_joint_pain",
      question: "Do you have hip joint pain?",
      symptom: "hip_joint_pain",
      followUps: ["painful_walking"],
    },
    weakness_in_limbs: {
      id: "weakness_in_limbs",
      question: "Do you have weakness in your limbs?",
      symptom: "weakness_in_limbs",
      followUps: ["weakness_of_one_body_side", "unsteadiness"],
    },
    weakness_of_one_body_side: {
      id: "weakness_of_one_body_side",
      question: "Do you have weakness on one side of your body?",
      symptom: "weakness_of_one_body_side",
      followUps: ["altered_sensorium"],
    },
    swelling_joints: {
      id: "swelling_joints",
      question: "Do you have swollen joints?",
      symptom: "swelling_joints",
      followUps: ["joint_pain"],
    },
    movement_stiffness: {
      id: "movement_stiffness",
      question: "Do you experience stiffness with movement?",
      symptom: "movement_stiffness",
      followUps: ["painful_walking"],
    },
    cramps: {
      id: "cramps",
      question: "Do you experience muscle cramps?",
      symptom: "cramps",
      followUps: ["muscle_pain"],
    },
    bruising: {
      id: "bruising",
      question: "Do you have unexplained bruising?",
      symptom: "bruising",
      followUps: [],
    },
    painful_walking: {
      id: "painful_walking",
      question: "Do you experience pain when walking?",
      symptom: "painful_walking",
      followUps: [],
    },

    // Category: CARDIOVASCULAR & CHEST SYMPTOMS
    chest_pain: {
      id: "chest_pain",
      question: "Do you experience chest pain or discomfort?",
      symptom: "chest_pain",
      followUps: ["fast_heart_rate", "breathlessness", "sweating"],
    },
    fast_heart_rate: {
      id: "fast_heart_rate",
      question: "Do you notice a fast heartbeat or palpitations?",
      symptom: "fast_heart_rate",
      followUps: ["palpitations"],
    },
    palpitations: {
      id: "palpitations",
      question: "Do you experience heart palpitations?",
      symptom: "palpitations",
      followUps: ["chest_pain"],
    },
    prominent_veins_on_calf: {
      id: "prominent_veins_on_calf",
      question: "Do you have prominent veins on your calf?",
      symptom: "prominent_veins_on_calf",
      followUps: ["swollen_legs"],
    },

    // Category: SYSTEMIC & GENERALIZED SYMPTOMS
    fatigue: {
      id: "fatigue",
      question: "Are you experiencing fatigue or extreme tiredness?",
      symptom: "fatigue",
      followUps: ["lethargy", "weakness_in_limbs"],
    },
    lethargy: {
      id: "lethargy",
      question: "Do you feel lethargic or lacking energy?",
      symptom: "lethargy",
      followUps: ["depression", "anxiety"],
    },
    sweating: {
      id: "sweating",
      question: "Are you experiencing excessive sweating?",
      symptom: "sweating",
      followUps: ["chills"],
    },
    chills: {
      id: "chills",
      question: "Are you experiencing chills or shivering?",
      symptom: "chills",
      followUps: [],
    },
    shivering: {
      id: "shivering",
      question: "Are you experiencing shivering?",
      symptom: "shivering",
      followUps: ["chills"],
    },
    dehydration: {
      id: "dehydration",
      question: "Do you feel dehydrated or very thirsty?",
      symptom: "dehydration",
      followUps: ["dark_urine", "dry_lips"],
    },
    malaise: {
      id: "malaise",
      question: "Do you have a general sense of illness or malaise?",
      symptom: "malaise",
      followUps: [],
    },
    toxic_look: {
      id: "toxic_look",
      question: "Do you look or feel toxic/severely ill?",
      symptom: "toxic_look_(typhos)",
      followUps: [],
    },

    // Category: MENTAL & NEUROLOGICAL
    dizziness: {
      id: "dizziness",
      question: "Are you experiencing dizziness?",
      symptom: "dizziness",
      followUps: ["loss_of_balance", "headache"],
    },
    loss_of_balance: {
      id: "loss_of_balance",
      question: "Do you have loss of balance?",
      symptom: "loss_of_balance",
      followUps: ["unsteadiness", "spinning_movements"],
    },
    unsteadiness: {
      id: "unsteadiness",
      question: "Do you feel unsteady?",
      symptom: "unsteadiness",
      followUps: [],
    },
    spinning_movements: {
      id: "spinning_movements",
      question: "Do you experience spinning movements or vertigo?",
      symptom: "spinning_movements",
      followUps: ["dizziness"],
    },
    altered_sensorium: {
      id: "altered_sensorium",
      question: "Do you experience confusion or altered consciousness?",
      symptom: "altered_sensorium",
      followUps: ["coma"],
    },
    coma: {
      id: "coma",
      question: "Are you or is the patient in a comatose state?",
      symptom: "coma",
      followUps: [],
    },
    depression: {
      id: "depression",
      question: "Are you experiencing depression or low mood?",
      symptom: "depression",
      followUps: ["anxiety", "irritability"],
    },
    anxiety: {
      id: "anxiety",
      question: "Are you experiencing anxiety?",
      symptom: "anxiety",
      followUps: ["mood_swings", "restlessness"],
    },
    irritability: {
      id: "irritability",
      question: "Are you experiencing irritability?",
      symptom: "irritability",
      followUps: ["mood_swings"],
    },
    mood_swings: {
      id: "mood_swings",
      question: "Do you experience mood swings?",
      symptom: "mood_swings",
      followUps: [],
    },
    restlessness: {
      id: "restlessness",
      question: "Do you feel restless?",
      symptom: "restlessness",
      followUps: [],
    },
    lack_of_concentration: {
      id: "lack_of_concentration",
      question: "Do you have a lack of concentration?",
      symptom: "lack_of_concentration",
      followUps: [],
    },
    slurred_speech: {
      id: "slurred_speech",
      question: "Do you experience slurred speech?",
      symptom: "slurred_speech",
      followUps: ["altered_sensorium"],
    },
    loss_of_smell: {
      id: "loss_of_smell",
      question: "Have you lost your sense of smell?",
      symptom: "loss_of_smell",
      followUps: [],
    },

    // Category: EYES & ENT
    sunken_eyes: {
      id: "sunken_eyes",
      question: "Do you have sunken eyes?",
      symptom: "sunken_eyes",
      followUps: ["dehydration"],
    },
    patches_in_throat: {
      id: "patches_in_throat",
      question: "Do you have patches in your throat?",
      symptom: "patches_in_throat",
      followUps: ["throat_irritation"],
    },
    ulcers_on_tongue: {
      id: "ulcers_on_tongue",
      question: "Do you have ulcers on your tongue?",
      symptom: "ulcers_on_tongue",
      followUps: [],
    },

    // Category: WEIGHT & METABOLIC
    weight_loss: {
      id: "weight_loss",
      question: "Have you experienced weight loss?",
      symptom: "weight_loss",
      followUps: ["loss_of_appetite", "fatigue"],
    },
    weight_gain: {
      id: "weight_gain",
      question: "Have you experienced weight gain?",
      symptom: "weight_gain",
      followUps: ["obesity"],
    },
    obesity: {
      id: "obesity",
      question: "Are you overweight or obese?",
      symptom: "obesity",
      followUps: [],
    },
    irregular_sugar_level: {
      id: "irregular_sugar_level",
      question: "Do you have irregular blood sugar levels?",
      symptom: "irregular_sugar_level",
      followUps: ["excessive_hunger", "polyuria"],
    },
    excessive_hunger: {
      id: "excessive_hunger",
      question: "Do you experience excessive hunger?",
      symptom: "excessive_hunger",
      followUps: [],
    },
    polyuria: {
      id: "polyuria",
      question: "Do you urinate excessively?",
      symptom: "polyuria",
      followUps: [],
    },

    // Category: URINARY & GENITAL
    burning_micturition: {
      id: "burning_micturition",
      question: "Do you experience burning during urination?",
      symptom: "burning_micturition",
      followUps: ["spotting_urination", "bladder_discomfort"],
    },
    spotting_urination: {
      id: "spotting_urination",
      question: "Do you have spotting or blood during urination?",
      symptom: "spotting_ urination",
      followUps: [],
    },
    bladder_discomfort: {
      id: "bladder_discomfort",
      question: "Do you experience bladder discomfort?",
      symptom: "bladder_discomfort",
      followUps: ["polyuria"],
    },
    foul_smell_of_urine: {
      id: "foul_smell_of_urine",
      question: "Does your urine have a foul smell?",
      symptom: "foul_smell_of urine",
      followUps: [],
    },
    continuous_feel_of_urine: {
      id: "continuous_feel_of_urine",
      question: "Do you have a continuous urge to urinate?",
      symptom: "continuous_feel_of_urine",
      followUps: [],
    },
    yellow_urine: {
      id: "yellow_urine",
      question: "Do you have yellow-colored urine?",
      symptom: "yellow_urine",
      followUps: [],
    },
    dark_urine: {
      id: "dark_urine",
      question: "Do you have dark-colored urine?",
      symptom: "dark_urine",
      followUps: ["yellowish_skin"],
    },
    passage_of_gases: {
      id: "passage_of_gases",
      question: "Do you experience excessive gas passage?",
      symptom: "passage_of_gases",
      followUps: [],
    },
    internal_itching: {
      id: "internal_itching",
      question: "Do you experience internal itching?",
      symptom: "internal_itching",
      followUps: [],
    },

    // Category: SKIN APPEARANCE
    brittle_nails: {
      id: "brittle_nails",
      question: "Do you have brittle nails?",
      symptom: "brittle_nails",
      followUps: ["small_dents_in_nails", "inflammatory_nails"],
    },
    small_dents_in_nails: {
      id: "small_dents_in_nails",
      question: "Do you have small dents in your nails?",
      symptom: "small_dents_in_nails",
      followUps: [],
    },
    inflammatory_nails: {
      id: "inflammatory_nails",
      question: "Do you have inflamed nails?",
      symptom: "inflammatory_nails",
      followUps: [],
    },
    cold_hands_and_feets: {
      id: "cold_hands_and_feets",
      question: "Do you have cold hands and feet?",
      symptom: "cold_hands_and_feets",
      followUps: ["swollen_extremeties"],
    },
    swollen_legs: {
      id: "swollen_legs",
      question: "Do you have swollen legs?",
      symptom: "swollen_legs",
      followUps: ["swollen_blood_vessels", "swollen_extremeties"],
    },
    swollen_blood_vessels: {
      id: "swollen_blood_vessels",
      question: "Do you have swollen blood vessels?",
      symptom: "swollen_blood_vessels",
      followUps: [],
    },
    swollen_extremeties: {
      id: "swollen_extremeties",
      question: "Do you have swollen extremities (hands/feet)?",
      symptom: "swollen_extremeties",
      followUps: [],
    },
    puffy_face_and_eyes: {
      id: "puffy_face_and_eyes",
      question: "Do you have a puffy face and eyes?",
      symptom: "puffy_face_and_eyes",
      followUps: ["swelling_of_stomach", "fluid_overload"],
    },
    enlarged_thyroid: {
      id: "enlarged_thyroid",
      question: "Do you have an enlarged thyroid?",
      symptom: "enlarged_thyroid",
      followUps: [],
    },

    // Category: HEPATIC & JAUNDICE
    yellowish_skin: {
      id: "yellowish_skin",
      question: "Do you have yellowish skin (jaundice)?",
      symptom: "yellowish_skin",
      followUps: ["yellowing_of_eyes", "dark_urine"],
    },
    yellowing_of_eyes: {
      id: "yellowing_of_eyes",
      question: "Do your eyes appear yellow (jaundice)?",
      symptom: "yellowing_of_eyes",
      followUps: [],
    },
    acute_liver_failure: {
      id: "acute_liver_failure",
      question: "Do you have symptoms of acute liver failure?",
      symptom: "acute_liver_failure",
      followUps: [],
    },

    // Category: ABDOMINAL FLUID & SWELLING
    fluid_overload: {
      id: "fluid_overload",
      question: "Do you have fluid overload or edema?",
      symptom: "fluid_overload",
      followUps: ["swelling_of_stomach", "distention_of_abdomen"],
    },
    swelling_of_stomach: {
      id: "swelling_of_stomach",
      question: "Do you have swelling of the stomach?",
      symptom: "swelling_of_stomach",
      followUps: [],
    },
    distention_of_abdomen: {
      id: "distention_of_abdomen",
      question: "Do you experience abdominal distention or bloating?",
      symptom: "distention_of_abdomen",
      followUps: [],
    },

    // Category: LYMPHATIC & SYSTEMIC
    swelled_lymph_nodes: {
      id: "swelled_lymph_nodes",
      question: "Do you have swollen lymph nodes?",
      symptom: "swelled_lymph_nodes",
      followUps: [],
    },

    // Category: RESPIRATORY SPUTUM TYPES
    mucoid_sputum: {
      id: "mucoid_sputum",
      question: "Do you cough up mucoid sputum?",
      symptom: "mucoid_sputum",
      followUps: [],
    },
    rusty_sputum: {
      id: "rusty_sputum",
      question: "Do you cough up rusty-colored sputum?",
      symptom: "rusty_sputum",
      followUps: [],
    },
    blood_in_sputum: {
      id: "blood_in_sputum",
      question: "Do you cough up blood in sputum?",
      symptom: "blood_in_sputum",
      followUps: [],
    },

    // Category: MENSTRUAL & GYNECOLOGICAL
    abnormal_menstruation: {
      id: "abnormal_menstruation",
      question: "Do you have abnormal menstruation?",
      symptom: "abnormal_menstruation",
      followUps: [],
    },

    // Category: GI BLEEDING & SEVERE
    stomach_bleeding: {
      id: "stomach_bleeding",
      question: "Do you have stomach or internal bleeding?",
      symptom: "stomach_bleeding",
      followUps: ["bloody_stool", "blood_in_sputum"],
    },

    // Category: LIPS & MOUTH
    drying_and_tingling_lips: {
      id: "drying_and_tingling_lips",
      question: "Do you have drying or tingling lips?",
      symptom: "drying_and_tingling_lips",
      followUps: ["dehydration"],
    },
    dry_lips: {
      id: "dry_lips",
      question: "Do you have dry lips?",
      symptom: "drying_and_tingling_lips",
      followUps: [],
    },

    // Category: RISK FACTORS & HISTORY
    family_history: {
      id: "family_history",
      question: "Do you have a family history of chronic diseases?",
      symptom: "family_history",
      followUps: [],
    },
    history_of_alcohol_consumption: {
      id: "history_of_alcohol_consumption",
      question: "Do you have a history of alcohol consumption?",
      symptom: "history_of_alcohol_consumption",
      followUps: [],
    },
    receiving_blood_transfusion: {
      id: "receiving_blood_transfusion",
      question: "Have you received a blood transfusion?",
      symptom: "receiving_blood_transfusion",
      followUps: [],
    },
    receiving_unsterile_injections: {
      id: "receiving_unsterile_injections",
      question: "Have you received unsterile injections?",
      symptom: "receiving_unsterile_injections",
      followUps: [],
    },
    extra_marital_contacts: {
      id: "extra_marital_contacts",
      question: "Do you have extramarital sexual contacts?",
      symptom: "extra_marital_contacts",
      followUps: [],
    },
  };

  // Build dynamic question flow based on answers
  const buildNextQuestions = (answeredQuestions) => {
    const nextQuestions = [];
    const yesAnswers = Object.keys(answeredQuestions).filter(
      (key) => answeredQuestions[key] === true,
    );

    // Collect follow-up questions from yes answers
    yesAnswers.forEach((answerId) => {
      const question = allQuestions[answerId];
      if (question && question.followUps) {
        question.followUps.forEach((followUpId) => {
          if (
            !answeredQuestions.hasOwnProperty(followUpId) &&
            !nextQuestions.find((q) => q.id === followUpId)
          ) {
            nextQuestions.push(allQuestions[followUpId]);
          }
        });
      }
    });

    // If no follow-ups yet, start with initial screening questions
    if (nextQuestions.length === 0 && yesAnswers.length === 0) {
      return [
        allQuestions.high_fever,
        allQuestions.cough,
        allQuestions.headache,
        allQuestions.chest_pain,
        allQuestions.breathlessness,
        allQuestions.nausea,
        allQuestions.diarrhoea,
        allQuestions.skin_rash,
      ];
    }

    return nextQuestions;
  };

  const initialQuestions = [
    // Fever & Temperature
    allQuestions.high_fever,
    allQuestions.mild_fever,
    // Respiratory
    allQuestions.cough,
    allQuestions.breathlessness,
    // GI
    allQuestions.nausea,
    allQuestions.stomach_pain,
    allQuestions.diarrhoea,
    // Pain
    allQuestions.headache,
    allQuestions.chest_pain,
    allQuestions.joint_pain,
    allQuestions.back_pain,
    // Skin
    allQuestions.skin_rash,
    // Systemic
    allQuestions.fatigue,
    allQuestions.sweating,
    allQuestions.weight_loss,
  ];

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your AI Health Assistant 🤖",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [confirmedSymptoms, setConfirmedSymptoms] = useState([]);
  const [answeredQuestions, setAnsweredQuestions] = useState({});
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [diagnosed, setDiagnosed] = useState(false);
  const [questionnireStarted, setQuestionnaireStarted] = useState(false);
  const [userGreeted, setUserGreeted] = useState(false);
  const messagesEndRef = useRef(null);
  const msgIdRef = useRef(1);
  const nextId = () => ++msgIdRef.current;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleUserGreeting = () => {
    // Add user greeting message
    const greetingMessage = {
      id: nextId(),
      text: "Hi",
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, greetingMessage]);
    setUserGreeted(true);

    // Bot responds with questionnaire intro after a delay
    setTimeout(() => {
      const botResponse = {
        id: nextId(),
        text: "Great! Let's fill out a questionnaire according to your symptoms. I'll ask targeted yes/no questions that adapt based on your answers.\n\nRemember: This is for informational purposes only and not a replacement for professional medical advice.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setQuestionnaireStarted(true);

      // Ask first question after another delay
      setTimeout(() => {
        setCurrentQuestions(initialQuestions);
        const firstQuestion = {
          id: nextId(),
          text: initialQuestions[0].question,
          sender: "bot",
          timestamp: new Date(),
          isQuestion: true,
        };
        setMessages((prev) => [...prev, firstQuestion]);
      }, 800);
    }, 600);
  };

  const handleResponse = async (answer) => {
    if (loading || diagnosed) return;

    // Get current question
    const currentQuestion = currentQuestions[currentQuestionIndex];
    if (!currentQuestion) return;

    // Add user response
    const userMessage = {
      id: nextId(),
      text: answer === "yes" ? "Yes" : "No",
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Update answered questions
    const newAnsweredQuestions = {
      ...answeredQuestions,
      [currentQuestion.id]: answer === "yes",
    };
    setAnsweredQuestions(newAnsweredQuestions);

    // Track confirmed symptoms
    if (answer === "yes") {
      setConfirmedSymptoms((prev) => [
        ...new Set([...prev, currentQuestion.symptom]),
      ]);
    }

    // Get next questions based on all answers
    const nextQuestions = buildNextQuestions(newAnsweredQuestions);
    const nextIndex = currentQuestionIndex + 1;

    // Add slight delay before next question for natural flow
    setTimeout(() => {
      if (nextIndex < nextQuestions.length) {
        // Ask next question
        setCurrentQuestions(nextQuestions);
        setCurrentQuestionIndex(nextIndex);
        const nextQ = nextQuestions[nextIndex];
        const botMessage = {
          id: nextId(),
          text: nextQ.question,
          sender: "bot",
          timestamp: new Date(),
          isQuestion: true,
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        // All questions answered, trigger diagnosis
        makeDiagnosis();
      }
    }, 600);
  };

  const makeDiagnosis = async () => {
    setLoading(true);
    setDiagnosed(true);

    try {
      const API_BASE =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

      // Build symptom string from confirmed symptoms
      const symptomsText = confirmedSymptoms.join(", ");

      if (!symptomsText) {
        const botMessage = {
          id: nextId(),
          text: "Based on your responses, you don't have any of the major symptoms I asked about.\n\nThis could indicate a mild condition or something specific I need more information about.\n\n**Recommendation:** If you're experiencing any other health concerns, please consult with a healthcare professional.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/ai-symptoms/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symptoms: symptomsText,
          sessionSymptoms: confirmedSymptoms,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let botReply = "";
      if (data.data) {
        const { possibleConditions, recommendation } = data.data;

        if (possibleConditions && possibleConditions.length > 0) {
          // Build multiple diagnoses display
          let conditionsText =
            "📋 **Possible Conditions (Ranked by Likelihood)**\n\n";

          possibleConditions.forEach((condition, index) => {
            const rank = index + 1;
            const emoji =
              condition.confidence > 0.5
                ? "🔴"
                : condition.confidence > 0.3
                  ? "�"
                  : "🟢";

            const confidenceBar =
              "█".repeat(Math.round(condition.confidencePercent / 5)) +
              "░".repeat(20 - Math.round(condition.confidencePercent / 5));

            conditionsText += `${rank}. **${condition.name}** ${emoji}\n`;
            conditionsText += `   Confidence: ${condition.confidencePercent}%\n`;
            conditionsText += `   [${confidenceBar}]\n\n`;
          });

          botReply = `📋 **Diagnosis Analysis**\n\nBased on your symptoms (${confirmedSymptoms.join(", ")}):\n\n${conditionsText}💡 **Recommendation:** ${recommendation}\n\n⚠️ **Important:** This is an AI analysis for informational purposes only. Consult with a healthcare professional for proper diagnosis and treatment.`;
        } else {
          botReply = `Based on your symptoms, I couldn't determine specific conditions with sufficient confidence.\n\n💡 ${recommendation}\n\n⚠️ Please consult with a healthcare professional.`;
        }
      } else {
        botReply =
          "I was unable to analyze your symptoms at this time. Please try again or consult a healthcare professional.";
      }

      const botMessage = {
        id: nextId(),
        text: botReply,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = {
        id: nextId(),
        text: "Sorry, I encountered an error analyzing your symptoms. Please try again or consult a healthcare professional.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const resetDiagnosis = () => {
    msgIdRef.current = 1;
    setMessages([
      {
        id: 1,
        text: "Hi! I'm your AI Health Assistant 🤖",
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
    setCurrentQuestionIndex(0);
    setConfirmedSymptoms([]);
    setDiagnosed(false);
    setUserGreeted(false);
    setQuestionnaireStarted(false);
  };

  return (
    <div className="sc-container">
      <div className="sc-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`sc-message sc-${msg.sender}`}>
            <div className="sc-message-bubble">
              {msg.text.split("\n").map((line, idx) => (
                <div key={idx}>
                  {line.includes("**") ? (
                    <>
                      {line
                        .split("**")
                        .map((part, i) =>
                          i % 2 === 1 ? (
                            <strong key={i}>{part}</strong>
                          ) : (
                            <span key={i}>{part}</span>
                          ),
                        )}
                    </>
                  ) : (
                    line
                  )}
                </div>
              ))}
            </div>
            <div className="sc-message-time">
              {msg.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
        {loading && (
          <div className="sc-message sc-bot">
            <div className="sc-message-bubble sc-typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="sc-input-area">
        {!userGreeted ? (
          <button
            className="sc-btn sc-btn-start"
            onClick={handleUserGreeting}
            disabled={loading}
          >
            👋 Hi / Say Hello
          </button>
        ) : !questionnireStarted ? (
          <button
            className="sc-btn sc-btn-start"
            onClick={() => {
              setQuestionnaireStarted(true);
              setCurrentQuestions(initialQuestions);
              const firstQuestion = {
                id: nextId(),
                text: initialQuestions[0].question,
                sender: "bot",
                timestamp: new Date(),
                isQuestion: true,
              };
              setMessages((prev) => [...prev, firstQuestion]);
            }}
            disabled={loading}
          >
            📋 Start Questionnaire
          </button>
        ) : !diagnosed ? (
          currentQuestionIndex < currentQuestions.length && !loading ? (
            <div className="sc-button-group">
              <button
                className="sc-btn sc-btn-yes"
                onClick={() => handleResponse("yes")}
                disabled={loading}
              >
                ✓ Yes
              </button>
              <button
                className="sc-btn sc-btn-no"
                onClick={() => handleResponse("no")}
                disabled={loading}
              >
                ✗ No
              </button>
            </div>
          ) : null
        ) : (
          <button
            className="sc-btn sc-btn-reset"
            onClick={resetDiagnosis}
            disabled={loading}
          >
            🔄 Start Over
          </button>
        )}
      </div>
    </div>
  );
};

export default SymptomChecker;
