"use client";

import { Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { UserRole } from "@/types/enums";
import { useState } from "react";
import { Department } from "@/types/enums";

const nigeriaStates = [
  {
    state: "Abia",
    lgas: [
      "Aba North",
      "Aba South",
      "Arochukwu",
      "Bende",
      "Ikawuno",
      "Ikwuano",
      "Isiala-Ngwa North",
      "Isiala-Ngwa South",
      "Isuikwuato",
      "Umu Nneochi",
      "Obi Ngwa",
      "Obioma Ngwa",
      "Ohafia",
      "Ohaozara",
      "Osisioma",
      "Ugwunagbo",
      "Ukwa West",
      "Ukwa East",
      "Umuahia North",
      "Umuahia South",
    ],
  },
  {
    state: "Adamawa",
    lgas: [
      "Demsa",
      "Fufore",
      "Ganye",
      "Girei",
      "Gombi",
      "Guyuk",
      "Hong",
      "Jada",
      "Lamurde",
      "Madagali",
      "Maiha",
      "Mayo-Belwa",
      "Michika",
      "Mubi-North",
      "Mubi-South",
      "Numan",
      "Shelleng",
      "Song",
      "Toungo",
      "Yola North",
      "Yola South",
    ],
  },
  {
    state: "Akwa Ibom",
    lgas: [
      "Abak",
      "Eastern-Obolo",
      "Eket",
      "Esit-Eket",
      "Essien-Udim",
      "Etim-Ekpo",
      "Etinan",
      "Ibeno",
      "Ibesikpo-Asutan",
      "Ibiono-Ibom",
      "Ika",
      "Ikono",
      "Ikot-Abasi",
      "Ikot-Ekpene",
      "Ini",
      "Itu",
      "Mbo",
      "Mkpat-Enin",
      "Nsit-Atai",
      "Nsit-Ibom",
      "Nsit-Ubium",
      "Obot-Akara",
      "Okobo",
      "Onna",
      "Oron",
      "Oruk Anam",
      "Udung-Uko",
      "Ukanafun",
      "Urue-Offong/Oruko",
      "Uruan",
      "Uyo",
    ],
  },
  {
    state: "Anambra",
    lgas: [
      "Aguata",
      "Anambra East",
      "Anambra West",
      "Anaocha",
      "Awka North",
      "Awka South",
      "Ayamelum",
      "Dunukofia",
      "Ekwusigo",
      "Idemili-North",
      "Idemili-South",
      "Ihiala",
      "Njikoka",
      "Nnewi-North",
      "Nnewi-South",
      "Ogbaru",
      "Onitsha-North",
      "Onitsha-South",
      "Orumba-North",
      "Orumba-South",
    ],
  },
  {
    state: "Bauchi",
    lgas: [
      "Alkaleri",
      "Bauchi",
      "Bogoro",
      "Damban",
      "Darazo",
      "Dass",
      "Gamawa",
      "Ganjuwa",
      "Giade",
      "Itas/Gadau",
      "Jama'Are",
      "Katagum",
      "Kirfi",
      "Misau",
      "Ningi",
      "Shira",
      "Tafawa-Balewa",
      "Toro",
      "Warji",
      "Zaki",
    ],
  },
  {
    state: "Bayelsa",
    lgas: [
      "Brass",
      "Ekeremor",
      "Kolokuma/Opokuma",
      "Nembe",
      "Ogbia",
      "Sagbama",
      "Southern-Ijaw",
      "Yenagoa",
    ],
  },
  {
    state: "Benue",
    lgas: [
      "Ado",
      "Agatu",
      "Apa",
      "Buruku",
      "Gboko",
      "Guma",
      "Gwer-East",
      "Gwer-West",
      "Katsina-Ala",
      "Konshisha",
      "Kwande",
      "Logo",
      "Makurdi",
      "Ogbadibo",
      "Ohimini",
      "Oju",
      "Okpokwu",
      "Otukpo",
      "Tarka",
      "Ukum",
      "Ushongo",
      "Vandeikya",
    ],
  },
  {
    state: "Borno",
    lgas: [
      "Abadam",
      "Askira-Uba",
      "Bama",
      "Bayo",
      "Biu",
      "Chibok",
      "Damboa",
      "Dikwa",
      "Gubio",
      "Guzamala",
      "Gwoza",
      "Hawul",
      "Jere",
      "Kaga",
      "Kala/Balge",
      "Konduga",
      "Kukawa",
      "Kwaya-Kusar",
      "Mafa",
      "Magumeri",
      "Maiduguri",
      "Marte",
      "Mobbar",
      "Monguno",
      "Ngala",
      "Nganzai",
      "Shani",
    ],
  },
  {
    state: "Cross River",
    lgas: [
      "Abi",
      "Akamkpa",
      "Akpabuyo",
      "Bakassi",
      "Bekwarra",
      "Biase",
      "Boki",
      "Calabar-Municipal",
      "Calabar-South",
      "Etung",
      "Ikom",
      "Obanliku",
      "Obubra",
      "Obudu",
      "Odukpani",
      "Ogoja",
      "Yakurr",
      "Yala",
    ],
  },
  {
    state: "Delta",
    lgas: [
      "Aniocha North",
      "Aniocha-South",
      "Bomadi",
      "Burutu",
      "Ethiope-East",
      "Ethiope-West",
      "Ika-North-East",
      "Ika-South",
      "Isoko-North",
      "Isoko-South",
      "Ndokwa-East",
      "Ndokwa-West",
      "Okpe",
      "Oshimili-North",
      "Oshimili-South",
      "Patani",
      "Sapele",
      "Udu",
      "Ughelli-North",
      "Ughelli-South",
      "Ukwuani",
      "Uvwie",
      "Warri South-West",
      "Warri North",
      "Warri South",
    ],
  },
  {
    state: "Ebonyi",
    lgas: [
      "Abakaliki",
      "Afikpo-North",
      "Afikpo South (Edda)",
      "Ebonyi",
      "Ezza-North",
      "Ezza-South",
      "Ikwo",
      "Ishielu",
      "Ivo",
      "Izzi",
      "Ohaukwu",
      "Onicha",
    ],
  },
  {
    state: "Edo",
    lgas: [
      "Akoko Edo",
      "Egor",
      "Esan-Central",
      "Esan-North-East",
      "Esan-South-East",
      "Esan-West",
      "Etsako-Central",
      "Etsako-East",
      "Etsako-West",
      "Igueben",
      "Ikpoba-Okha",
      "Oredo",
      "Orhionmwon",
      "Ovia-North-East",
      "Ovia-South-West",
      "Owan East",
      "Owan-West",
      "Uhunmwonde",
    ],
  },
  {
    state: "Ekiti",
    lgas: [
      "Ado-Ekiti",
      "Efon",
      "Ekiti-East",
      "Ekiti-South-West",
      "Ekiti-West",
      "Emure",
      "Gbonyin",
      "Ido-Osi",
      "Ijero",
      "Ikere",
      "Ikole",
      "Ilejemeje",
      "Irepodun/Ifelodun",
      "Ise-Orun",
      "Moba",
      "Oye",
    ],
  },
  {
    state: "Enugu",
    lgas: [
      "Aninri",
      "Awgu",
      "Enugu-East",
      "Enugu-North",
      "Enugu-South",
      "Ezeagu",
      "Igbo-Etiti",
      "Igbo-Eze-North",
      "Igbo-Eze-South",
      "Isi-Uzo",
      "Nkanu-East",
      "Nkanu-West",
      "Nsukka",
      "Oji-River",
      "Udenu",
      "Udi",
      "Uzo-Uwani",
    ],
  },
  {
    state: "Federal Capital Territory",
    lgas: ["Abuja", "Kwali", "Kuje", "Gwagwalada", "Bwari", "Abaji"],
  },
  {
    state: "Gombe",
    lgas: [
      "Akko",
      "Balanga",
      "Billiri",
      "Dukku",
      "Funakaye",
      "Gombe",
      "Kaltungo",
      "Kwami",
      "Nafada",
      "Shongom",
      "Yamaltu/Deba",
    ],
  },
  {
    state: "Imo",
    lgas: [
      "Aboh-Mbaise",
      "Ahiazu-Mbaise",
      "Ehime-Mbano",
      "Ezinihitte",
      "Ideato-North",
      "Ideato-South",
      "Ihitte/Uboma",
      "Ikeduru",
      "Isiala-Mbano",
      "Isu",
      "Mbaitoli",
      "Ngor-Okpala",
      "Njaba",
      "Nkwerre",
      "Nwangele",
      "Obowo",
      "Oguta",
      "Ohaji-Egbema",
      "Okigwe",
      "Onuimo",
      "Orlu",
      "Orsu",
      "Oru-East",
      "Oru-West",
      "Owerri-Municipal",
      "Owerri-North",
      "Owerri-West",
    ],
  },
  {
    state: "Jigawa",
    lgas: [
      "Auyo",
      "Babura",
      "Biriniwa",
      "Birnin-Kudu",
      "Buji",
      "Dutse",
      "Gagarawa",
      "Garki",
      "Gumel",
      "Guri",
      "Gwaram",
      "Gwiwa",
      "Hadejia",
      "Jahun",
      "Kafin-Hausa",
      "Kaugama",
      "Kazaure",
      "Kiri kasama",
      "Maigatari",
      "Malam Madori",
      "Miga",
      "Ringim",
      "Roni",
      "Sule-Tankarkar",
      "Taura",
      "Yankwashi",
    ],
  },
  {
    state: "Kaduna",
    lgas: [
      "Birnin-Gwari",
      "Chikun",
      "Giwa",
      "Igabi",
      "Ikara",
      "Jaba",
      "Jema'A",
      "Kachia",
      "Kaduna-North",
      "Kaduna-South",
      "Kagarko",
      "Kajuru",
      "Kaura",
      "Kauru",
      "Kubau",
      "Kudan",
      "Lere",
      "Makarfi",
      "Sabon-Gari",
      "Sanga",
      "Soba",
      "Zangon-Kataf",
      "Zaria",
    ],
  },
  {
    state: "Kano",
    lgas: [
      "Ajingi",
      "Albasu",
      "Bagwai",
      "Bebeji",
      "Bichi",
      "Bunkure",
      "Dala",
      "Dambatta",
      "Dawakin-Kudu",
      "Dawakin-Tofa",
      "Doguwa",
      "Fagge",
      "Gabasawa",
      "Garko",
      "Garun-Mallam",
      "Gaya",
      "Gezawa",
      "Gwale",
      "Gwarzo",
      "Kabo",
      "Kano-Municipal",
      "Karaye",
      "Kibiya",
      "Kiru",
      "Kumbotso",
      "Kunchi",
      "Kura",
      "Madobi",
      "Makoda",
      "Minjibir",
      "Nasarawa",
      "Rano",
      "Rimin-Gado",
      "Rogo",
      "Shanono",
      "Sumaila",
      "Takai",
      "Tarauni",
      "Tofa",
      "Tsanyawa",
      "Tudun-Wada",
      "Ungogo",
      "Warawa",
      "Wudil",
    ],
  },
  {
    state: "Katsina",
    lgas: [
      "Bakori",
      "Batagarawa",
      "Batsari",
      "Baure",
      "Bindawa",
      "Charanchi",
      "Dan-Musa",
      "Dandume",
      "Danja",
      "Daura",
      "Dutsi",
      "Dutsin-Ma",
      "Faskari",
      "Funtua",
      "Ingawa",
      "Jibia",
      "Kafur",
      "Kaita",
      "Kankara",
      "Kankia",
      "Katsina",
      "Kurfi",
      "Kusada",
      "Mai-Adua",
      "Malumfashi",
      "Mani",
      "Mashi",
      "Matazu",
      "Musawa",
      "Rimi",
      "Sabuwa",
      "Safana",
      "Sandamu",
      "Zango",
    ],
  },
  {
    state: "Kebbi",
    lgas: [
      "Aleiro",
      "Arewa-Dandi",
      "Argungu",
      "Augie",
      "Bagudo",
      "Birnin-Kebbi",
      "Bunza",
      "Dandi",
      "Fakai",
      "Gwandu",
      "Jega",
      "Kalgo",
      "Koko-Besse",
      "Maiyama",
      "Ngaski",
      "Sakaba",
      "Shanga",
      "Suru",
      "Wasagu/Danko",
      "Yauri",
      "Zuru",
    ],
  },
  {
    state: "Kogi",
    lgas: [
      "Adavi",
      "Ajaokuta",
      "Ankpa",
      "Dekina",
      "Ibaji",
      "Idah",
      "Igalamela-Odolu",
      "Ijumu",
      "Kabba/Bunu",
      "Kogi",
      "Lokoja",
      "Mopa-Muro",
      "Ofu",
      "Ogori/Magongo",
      "Okehi",
      "Okene",
      "Olamaboro",
      "Omala",
      "Oyi",
      "Yagba-East",
      "Yagba-West",
    ],
  },
  {
    state: "Kwara",
    lgas: [
      "Edu: Lafiagi",
      "Ekiti: Araromi-Opin",
      "Ifelodun: Share",
      "Ilorin East: Oke-Oyi",
      "Ilorin South: Fufu",
      "Ilorin West: Oja-Oba",
      "Irepodun: Omu-Aran",
      "Isin: Owu-Isin",
      "Kaiama: Kaiama",
      "Moro: Bode-Saadu",
      "Offa: Offa",
      "Oke-Ero: Ilofa",
      "Oyun: Ilemona",
      "Patigi: Patigi",
      "Asa: Afon",
      "Baruten: Kosubosu",
    ],
  },
  {
    state: "Lagos",
    lgas: [
      "Agege",
      "Ajeromi-Ifelodun",
      "Alimosho",
      "Amuwo-Odofin",
      "Apapa",
      "Badagry",
      "Epe",
      "Eti-Osa",
      "Ibeju-Lekki",
      "Ifako-Ijaiye",
      "Ikeja",
      "Ikorodu",
      "Kosofe",
      "Lagos-Island",
      "Lagos-Mainland",
      "Mushin",
      "Ojo",
      "Oshodi-Isolo",
      "Shomolu",
      "Surulere",
      "Yewa-South",
    ],
  },
  {
    state: "Nasarawa",
    lgas: [
      "Akwanga",
      "Awe",
      "Doma",
      "Karu",
      "Keana",
      "Keffi",
      "Kokona",
      "Lafia",
      "Nasarawa",
      "Nasarawa-Eggon",
      "Obi",
      "Wamba",
      "Toto",
    ],
  },
  {
    state: "Niger",
    lgas: [
      "Agaie",
      "Agwara",
      "Bida",
      "Borgu",
      "Bosso",
      "Chanchaga",
      "Edati",
      "Gbako",
      "Gurara",
      "Katcha",
      "Kontagora",
      "Lapai",
      "Lavun",
      "Magama",
      "Mariga",
      "Mashegu",
      "Mokwa",
      "Moya",
      "Paikoro",
      "Rafi",
      "Rijau",
      "Shiroro",
      "Suleja",
      "Tafa",
      "Wushishi",
    ],
  },
  {
    state: "Ogun",
    lgas: [
      "Abeokuta-North",
      "Abeokuta-South",
      "Ado-Odo/Ota",
      "Ewekoro",
      "Ifo",
      "Ijebu-East",
      "Ijebu-North",
      "Ijebu-North-East",
      "Ijebu-Ode",
      "Ikenne",
      "Imeko-Afon",
      "Ipokia",
      "Obafemi-Owode",
      "Odeda",
      "Odogbolu",
      "Ogun-Waterside",
      "Remo-North",
      "Shagamu",
      "Yewa North",
    ],
  },
  {
    state: "Ondo",
    lgas: [
      "Akoko North-East",
      "Akoko North-West",
      "Akoko South-West",
      "Akoko South-East",
      "Akure-North",
      "Akure-South",
      "Ese-Odo",
      "Idanre",
      "Ifedore",
      "Ilaje",
      "Ile-Oluji-Okeigbo",
      "Irele",
      "Odigbo",
      "Okitipupa",
      "Ondo West",
      "Ondo-East",
      "Ose",
      "Owo",
    ],
  },
  {
    state: "Osun",
    lgas: [
      "Atakumosa West",
      "Atakumosa East",
      "Ayedaade",
      "Ayedire",
      "Boluwaduro",
      "Boripe",
      "Ede South",
      "Ede North",
      "Egbedore",
      "Ejigbo",
      "Ife North",
      "Ife South",
      "Ife-Central",
      "Ife-East",
      "Ifelodun",
      "Ila",
      "Ilesa-East",
      "Ilesa-West",
      "Irepodun",
      "Irewole",
      "Isokan",
      "Iwo",
      "Obokun",
      "Odo-Otin",
      "Ola Oluwa",
      "Olorunda",
      "Oriade",
      "Orolu",
      "Osogbo",
    ],
  },
  {
    state: "Oyo",
    lgas: [
      "Afijio",
      "Akinyele",
      "Atiba",
      "Atisbo",
      "Egbeda",
      "Ibadan North",
      "Ibadan North-East",
      "Ibadan North-West",
      "Ibadan South-East",
      "Ibadan South-West",
      "Ibarapa-Central",
      "Ibarapa-East",
      "Ibarapa-North",
      "Ido",
      "Ifedayo",
      "Irepo",
      "Iseyin",
      "Itesiwaju",
      "Iwajowa",
      "Kajola",
      "Lagelu",
      "Ogo-Oluwa",
      "Ogbomosho-North",
      "Ogbomosho-South",
      "Olorunsogo",
      "Oluyole",
      "Ona-Ara",
      "Orelope",
      "Ori-Ire",
      "Oyo-West",
      "Oyo-East",
      "Saki-East",
      "Saki-West",
      "Surulere",
    ],
  },
  {
    state: "Plateau",
    lgas: [
      "Barkin-Ladi",
      "Bassa",
      "Bokkos",
      "Jos-East",
      "Jos-North",
      "Jos-South",
      "Kanam",
      "Kanke",
      "Langtang-North",
      "Langtang-South",
      "Mangu",
      "Mikang",
      "Pankshin",
      "Qua'an Pan",
      "Riyom",
      "Shendam",
      "Wase",
    ],
  },
  {
    state: "Rivers",
    lgas: [
      "Abua/Odual",
      "Ahoada-East",
      "Ahoada-West",
      "Akuku Toru",
      "Andoni",
      "Asari-Toru",
      "Bonny",
      "Degema",
      "Eleme",
      "Emuoha",
      "Etche",
      "Gokana",
      "Ikwerre",
      "Khana",
      "Obio/Akpor",
      "Ogba-Egbema-Ndoni",
      "Ogu/Bolo",
      "Okrika",
      "Omuma",
      "Opobo/Nkoro",
      "Oyigbo",
      "Port-Harcourt",
      "Tai",
    ],
  },
  {
    state: "Sokoto",
    lgas: [
      "Binji",
      "Bodinga",
      "Dange-Shuni",
      "Gada",
      "Goronyo",
      "Gudu",
      "Gwadabawa",
      "Illela",
      "Kebbe",
      "Kware",
      "Rabah",
      "Sabon Birni",
      "Shagari",
      "Silame",
      "Sokoto-North",
      "Sokoto-South",
      "Tambuwal",
      "Tangaza",
      "Tureta",
      "Wamako",
      "Wurno",
      "Yabo",
    ],
  },
  {
    state: "Taraba",
    lgas: [
      "Ardo-Kola",
      "Bali",
      "Donga",
      "Gashaka",
      "Gassol",
      "Ibi",
      "Jalingo",
      "Karim-Lamido",
      "Kurmi",
      "Lau",
      "Sardauna",
      "Takum",
      "Ussa",
      "Wukari",
      "Yorro",
      "Zing",
    ],
  },
  {
    state: "Yobe",
    lgas: [
      "Bade",
      "Bursari",
      "Damaturu",
      "Fika",
      "Fune",
      "Geidam",
      "Gujba",
      "Gulani",
      "Jakusko",
      "Karasuwa",
      "Machina",
      "Nangere",
      "Nguru",
      "Potiskum",
      "Tarmuwa",
      "Yunusari",
      "Yusufari",
    ],
  },
  {
    state: "Zamfara",
    lgas: [
      "Anka",
      "Bakura",
      "Birnin Magaji/Kiyaw",
      "Bukkuyum",
      "Bungudu",
      "Gummi",
      "Gusau",
      "Isa",
      "Kaura-Namoda",
      "Kiyawa",
      "Maradun",
      "Maru",
      "Shinkafi",
      "Talata-Mafara",
      "Tsafe",
      "Zurmi",
    ],
  },
];

const baseSchema = z.object({
  surname: z.string().min(2, "Required"),
  firstName: z.string().min(2, "Required"),
  otherName: z.string().optional(),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole),
});

const studentSchema = baseSchema.extend({
  role: z.literal(UserRole.STUDENT),
  admissionNumber: z.string().optional(),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine(
      (val) => {
        const date = new Date(val);
        const today = new Date();
        if (isNaN(date.getTime())) return false;
        if (date.getFullYear() < 1900) return false;
        if (date > today) return false;
        const minAgeDate = new Date(
          today.getFullYear() - 5,
          today.getMonth(),
          today.getDate(),
        );
        if (date > minAgeDate) return false;
        return true;
      },
      {
        message: "Student must be at least 5 years old and date must be valid",
      },
    ),
  gender: z.enum(["male", "female"]),
  currentClass: z.string().min(1, "Class is required"),
  address: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  religion: z.string().min(2, "Religion is required"),
  stateOfOrigin: z.string().min(2, "State of Origin is required"),
  localGovernment: z.string().min(2, "Local Government Area is required"),
});

const teacherSchema = baseSchema.extend({
  role: z.literal(UserRole.TEACHER),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
});

const parentSchema = baseSchema.extend({
  role: z.literal(UserRole.PARENT),
  occupation: z.string().optional(),
  relationship: z.string().optional(),
});

type FormData = z.infer<typeof baseSchema> & {
  admissionNumber?: string;
  Department?: Department;
  dateOfBirth?: string;
  gender?: "male" | "female";
  currentClass?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  religion?: string;
  stateOfOrigin?: string;
  localGovernment?: string;
  qualification?: string;
  specialization?: string;
  occupation?: string;
  relationship?: string;
  children?: [];
};

const getSchema = (role: UserRole) => {
  if (role === UserRole.STUDENT) return studentSchema;
  if (role === UserRole.TEACHER) return teacherSchema;
  return parentSchema;
};

interface UserFormProps {
  selectedRole: UserRole;
  classes: Array<{ _id: string; name: string }>;
  students: Array<{
    _id: string;
    surname: string;
    firstName: string;
    otherName: string;
  }>;
  isLoading: boolean;
  uploadingPhoto: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}

export default function UserForm({
  selectedRole,
  classes,
  students,
  isLoading,
  uploadingPhoto,
  onClose,
  onSubmit,
}: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(getSchema(selectedRole)) as Resolver<FormData>,
    defaultValues: { role: selectedRole },
  });

  const typedErrors = errors as Record<string, { message?: string }>;

  const [manualAdmission, setManualAdmission] = useState(false);
  const [selectedClassName, setSelectedClassName] = useState("");
  const [department, setDepartment] = useState<Department>(Department.NONE);
  const [selectedState, setSelectedState] = useState("");
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);

  const isSSS = selectedClassName.startsWith("SSS");

  const availableLgas =
    nigeriaStates.find((s) => s.state === selectedState)?.lgas ?? [];

  return (
    <form
      onSubmit={handleSubmit((data) => {
        if (isSSS && department === Department.NONE) return;
        onSubmit({
          ...(data as Record<string, unknown>),
          department,
          children: selectedChildren,
        });
      })}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Surname *
          </label>
          <input
            {...register("surname")}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f]"
          />
          {typedErrors.surname && (
            <p className="text-red-500 text-xs mt-1">
              {typedErrors.surname.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            {...register("firstName")}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f]"
          />
          {typedErrors.firstName && (
            <p className="text-red-500 text-xs mt-1">
              {typedErrors.firstName.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Other Name
          </label>
          <input
            {...register("otherName")}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <input
          {...register("email")}
          type="email"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f]"
        />
        {typedErrors.email && (
          <p className="text-red-500 text-xs mt-1">
            {typedErrors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          {...register("phone")}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f]"
        />
      </div>

      {/* Student-specific fields */}
      {selectedRole === UserRole.STUDENT && (
        <>
          {/* Admission Number */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Admission Number
              </label>
              <button
                type="button"
                onClick={() => setManualAdmission(!manualAdmission)}
                className="text-xs text-blue-600 hover:underline"
              >
                {manualAdmission
                  ? "Auto-generate instead"
                  : "Enter manually instead"}
              </button>
            </div>
            {manualAdmission ? (
              <>
                <input
                  {...register("admissionNumber")}
                  placeholder="e.g. GWS/22/0234"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f] uppercase"
                  onChange={(e) =>
                    (e.target.value = e.target.value.toUpperCase())
                  }
                />
                <p className="text-xs text-gray-400 mt-1">
                  Must be unique — enter the student&apos;s existing admission
                  number
                </p>
              </>
            ) : (
              <input
                value="Will be auto-generated"
                disabled
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            )}
          </div>

          {/* Class */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Class *
            </label>
            <select
              {...register("currentClass")}
              onChange={(e) => {
                register("currentClass").onChange(e);
                const selected = classes.find((c) => c._id === e.target.value);
                setSelectedClassName(selected?.name ?? "");
              }}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f]"
            >
              <option value="">Select class...</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
            {typedErrors.currentClass && (
              <p className="text-red-500 text-xs mt-1">
                {typedErrors.currentClass.message}
              </p>
            )}

            {/* Department — required for SSS classes */}
            {isSSS && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Department)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f]"
                >
                  <option value={Department.NONE}>Select department...</option>
                  <option value={Department.SCIENCE}>Science</option>
                  <option value={Department.ART}>Art</option>
                  <option value={Department.COMMERCIAL}>Commercial</option>
                </select>
                {isSSS && department === Department.NONE && (
                  <p className="text-red-500 text-xs mt-1">
                    Department is required for SSS students
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Date of Birth & Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                {...register("dateOfBirth")}
                type="date"
                min="1900-01-01"
                max={
                  new Date(new Date().setFullYear(new Date().getFullYear() - 5))
                    .toISOString()
                    .split("T")[0]
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm text-gray-900 bg-white focus:outline-none ${
                  typedErrors.dateOfBirth
                    ? "border-red-400 focus:border-red-400"
                    : "border-gray-200 focus:border-[#1e3a5f]"
                }`}
              />
              {typedErrors.dateOfBirth && (
                <p className="text-red-500 text-xs mt-1">
                  {typedErrors.dateOfBirth.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <select
                {...register("gender")}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f]"
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {typedErrors.gender && (
                <p className="text-red-500 text-xs mt-1">
                  {typedErrors.gender.message}
                </p>
              )}
            </div>
          </div>

          {/* Religion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Religion *
            </label>
            <select
              {...register("religion")}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f]"
            >
              <option value="">Select...</option>
              <option value="christianity">Christianity</option>
              <option value="islam">Islam</option>
              <option value="traditional">Traditional</option>
              <option value="other">Other</option>
            </select>
            {typedErrors.religion && (
              <p className="text-red-500 text-xs mt-1">
                {typedErrors.religion.message}
              </p>
            )}
          </div>

          {/* State of Origin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State of Origin *
            </label>
            <select
              {...register("stateOfOrigin")}
              onChange={(e) => {
                register("stateOfOrigin").onChange(e);
                setSelectedState(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f]"
            >
              <option value="">Select state...</option>
              {nigeriaStates.map((s) => (
                <option key={s.state} value={s.state}>
                  {s.state}
                </option>
              ))}
            </select>
            {typedErrors.stateOfOrigin && (
              <p className="text-red-500 text-xs mt-1">
                {typedErrors.stateOfOrigin.message}
              </p>
            )}
          </div>

          {/* Local Government Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Local Government Area *
            </label>
            <select
              {...register("localGovernment")}
              disabled={!selectedState}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f] disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <option value="">
                {selectedState ? "Select LGA..." : "Select a state first"}
              </option>
              {availableLgas.map((lga) => (
                <option key={lga} value={lga}>
                  {lga}
                </option>
              ))}
            </select>
            {typedErrors.localGovernment && (
              <p className="text-red-500 text-xs mt-1">
                {typedErrors.localGovernment.message}
              </p>
            )}
          </div>

          {/* Guardian & Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guardian Name
            </label>
            <input
              {...register("guardianName")}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guardian Phone
            </label>
            <input
              {...register("guardianPhone")}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              {...register("address")}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f]"
            />
          </div>
        </>
      )}

      {/* Teacher-specific fields */}
      {selectedRole === UserRole.TEACHER && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Qualification
            </label>
            <input
              {...register("qualification")}
              placeholder="e.g. B.Ed, M.Sc"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specialization
            </label>
            <input
              {...register("specialization")}
              placeholder="e.g. Mathematics, English"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f]"
            />
          </div>
        </>
      )}

      {/* Parent-specific fields */}
      {selectedRole === UserRole.PARENT && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Occupation
            </label>
            <input
              {...register("occupation")}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship to Child
            </label>
            <select
              {...register("relationship")}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f]"
            >
              <option value="">Select...</option>
              <option value="father">Father</option>
              <option value="mother">Mother</option>
              <option value="guardian">Guardian</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link Children{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="border border-gray-200 rounded-xl max-h-[180px] overflow-y-auto divide-y divide-gray-50">
              {students.length === 0 ? (
                <p className="text-xs text-gray-400 p-3">No students found</p>
              ) : (
                students.map((s) => {
                  const isSelected = selectedChildren.includes(s._id);
                  return (
                    <div
                      key={s._id}
                      onClick={() =>
                        setSelectedChildren((prev) =>
                          prev.includes(s._id)
                            ? prev.filter((id) => id !== s._id)
                            : [...prev, s._id],
                        )
                      }
                      className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                        isSelected ? "bg-[#1e3a5f]/5" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-sm text-gray-700">
                        {s.surname} {s.firstName} {s.otherName}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-[#1e3a5f] border-[#1e3a5f]"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {selectedChildren.length} child
              {selectedChildren.length !== 1 ? "ren" : ""} selected
            </p>
          </div>
        </>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <p className="text-xs text-blue-700">
          A temporary password will be auto-generated and sent to the
          user&apos;s email. They must change it on first login.
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || uploadingPhoto}
          className="flex-1 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold hover:bg-[#152847] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create User"
          )}
        </button>
      </div>
    </form>
  );
}
