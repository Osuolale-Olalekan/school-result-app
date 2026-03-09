"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader2, Camera, User, Save } from "lucide-react";
import { UserRole } from "@/types/enums";
import { toast } from "sonner";

const nigeriaStates = [
  { state: "Abia", lgas: ["Aba North","Aba South","Arochukwu","Bende","Ikawuno","Ikwuano","Isiala-Ngwa North","Isiala-Ngwa South","Isuikwuato","Umu Nneochi","Obi Ngwa","Obioma Ngwa","Ohafia","Ohaozara","Osisioma","Ugwunagbo","Ukwa West","Ukwa East","Umuahia North","Umuahia South"] },
  { state: "Adamawa", lgas: ["Demsa","Fufore","Ganye","Girei","Gombi","Guyuk","Hong","Jada","Lamurde","Madagali","Maiha","Mayo-Belwa","Michika","Mubi-North","Mubi-South","Numan","Shelleng","Song","Toungo","Yola North","Yola South"] },
  { state: "Akwa Ibom", lgas: ["Abak","Eastern-Obolo","Eket","Esit-Eket","Essien-Udim","Etim-Ekpo","Etinan","Ibeno","Ibesikpo-Asutan","Ibiono-Ibom","Ika","Ikono","Ikot-Abasi","Ikot-Ekpene","Ini","Itu","Mbo","Mkpat-Enin","Nsit-Atai","Nsit-Ibom","Nsit-Ubium","Obot-Akara","Okobo","Onna","Oron","Oruk Anam","Udung-Uko","Ukanafun","Urue-Offong/Oruko","Uruan","Uyo"] },
  { state: "Anambra", lgas: ["Aguata","Anambra East","Anambra West","Anaocha","Awka North","Awka South","Ayamelum","Dunukofia","Ekwusigo","Idemili-North","Idemili-South","Ihiala","Njikoka","Nnewi-North","Nnewi-South","Ogbaru","Onitsha-North","Onitsha-South","Orumba-North","Orumba-South"] },
  { state: "Bauchi", lgas: ["Alkaleri","Bauchi","Bogoro","Damban","Darazo","Dass","Gamawa","Ganjuwa","Giade","Itas/Gadau","Jama'Are","Katagum","Kirfi","Misau","Ningi","Shira","Tafawa-Balewa","Toro","Warji","Zaki"] },
  { state: "Bayelsa", lgas: ["Brass","Ekeremor","Kolokuma/Opokuma","Nembe","Ogbia","Sagbama","Southern-Ijaw","Yenagoa"] },
  { state: "Benue", lgas: ["Ado","Agatu","Apa","Buruku","Gboko","Guma","Gwer-East","Gwer-West","Katsina-Ala","Konshisha","Kwande","Logo","Makurdi","Ogbadibo","Ohimini","Oju","Okpokwu","Otukpo","Tarka","Ukum","Ushongo","Vandeikya"] },
  { state: "Borno", lgas: ["Abadam","Askira-Uba","Bama","Bayo","Biu","Chibok","Damboa","Dikwa","Gubio","Guzamala","Gwoza","Hawul","Jere","Kaga","Kala/Balge","Konduga","Kukawa","Kwaya-Kusar","Mafa","Magumeri","Maiduguri","Marte","Mobbar","Monguno","Ngala","Nganzai","Shani"] },
  { state: "Cross River", lgas: ["Abi","Akamkpa","Akpabuyo","Bakassi","Bekwarra","Biase","Boki","Calabar-Municipal","Calabar-South","Etung","Ikom","Obanliku","Obubra","Obudu","Odukpani","Ogoja","Yakurr","Yala"] },
  { state: "Delta", lgas: ["Aniocha North","Aniocha-South","Bomadi","Burutu","Ethiope-East","Ethiope-West","Ika-North-East","Ika-South","Isoko-North","Isoko-South","Ndokwa-East","Ndokwa-West","Okpe","Oshimili-North","Oshimili-South","Patani","Sapele","Udu","Ughelli-North","Ughelli-South","Ukwuani","Uvwie","Warri South-West","Warri North","Warri South"] },
  { state: "Ebonyi", lgas: ["Abakaliki","Afikpo-North","Afikpo South (Edda)","Ebonyi","Ezza-North","Ezza-South","Ikwo","Ishielu","Ivo","Izzi","Ohaukwu","Onicha"] },
  { state: "Edo", lgas: ["Akoko Edo","Egor","Esan-Central","Esan-North-East","Esan-South-East","Esan-West","Etsako-Central","Etsako-East","Etsako-West","Igueben","Ikpoba-Okha","Oredo","Orhionmwon","Ovia-North-East","Ovia-South-West","Owan East","Owan-West","Uhunmwonde"] },
  { state: "Ekiti", lgas: ["Ado-Ekiti","Efon","Ekiti-East","Ekiti-South-West","Ekiti-West","Emure","Gbonyin","Ido-Osi","Ijero","Ikere","Ikole","Ilejemeje","Irepodun/Ifelodun","Ise-Orun","Moba","Oye"] },
  { state: "Enugu", lgas: ["Aninri","Awgu","Enugu-East","Enugu-North","Enugu-South","Ezeagu","Igbo-Etiti","Igbo-Eze-North","Igbo-Eze-South","Isi-Uzo","Nkanu-East","Nkanu-West","Nsukka","Oji-River","Udenu","Udi","Uzo-Uwani"] },
  { state: "Federal Capital Territory", lgas: ["Abuja","Kwali","Kuje","Gwagwalada","Bwari","Abaji"] },
  { state: "Gombe", lgas: ["Akko","Balanga","Billiri","Dukku","Funakaye","Gombe","Kaltungo","Kwami","Nafada","Shongom","Yamaltu/Deba"] },
  { state: "Imo", lgas: ["Aboh-Mbaise","Ahiazu-Mbaise","Ehime-Mbano","Ezinihitte","Ideato-North","Ideato-South","Ihitte/Uboma","Ikeduru","Isiala-Mbano","Isu","Mbaitoli","Ngor-Okpala","Njaba","Nkwerre","Nwangele","Obowo","Oguta","Ohaji-Egbema","Okigwe","Onuimo","Orlu","Orsu","Oru-East","Oru-West","Owerri-Municipal","Owerri-North","Owerri-West"] },
  { state: "Jigawa", lgas: ["Auyo","Babura","Biriniwa","Birnin-Kudu","Buji","Dutse","Gagarawa","Garki","Gumel","Guri","Gwaram","Gwiwa","Hadejia","Jahun","Kafin-Hausa","Kaugama","Kazaure","Kiri kasama","Maigatari","Malam Madori","Miga","Ringim","Roni","Sule-Tankarkar","Taura","Yankwashi"] },
  { state: "Kaduna", lgas: ["Birnin-Gwari","Chikun","Giwa","Igabi","Ikara","Jaba","Jema'A","Kachia","Kaduna-North","Kaduna-South","Kagarko","Kajuru","Kaura","Kauru","Kubau","Kudan","Lere","Makarfi","Sabon-Gari","Sanga","Soba","Zangon-Kataf","Zaria"] },
  { state: "Kano", lgas: ["Ajingi","Albasu","Bagwai","Bebeji","Bichi","Bunkure","Dala","Dambatta","Dawakin-Kudu","Dawakin-Tofa","Doguwa","Fagge","Gabasawa","Garko","Garun-Mallam","Gaya","Gezawa","Gwale","Gwarzo","Kabo","Kano-Municipal","Karaye","Kibiya","Kiru","Kumbotso","Kunchi","Kura","Madobi","Makoda","Minjibir","Nasarawa","Rano","Rimin-Gado","Rogo","Shanono","Sumaila","Takai","Tarauni","Tofa","Tsanyawa","Tudun-Wada","Ungogo","Warawa","Wudil"] },
  { state: "Katsina", lgas: ["Bakori","Batagarawa","Batsari","Baure","Bindawa","Charanchi","Dan-Musa","Dandume","Danja","Daura","Dutsi","Dutsin-Ma","Faskari","Funtua","Ingawa","Jibia","Kafur","Kaita","Kankara","Kankia","Katsina","Kurfi","Kusada","Mai-Adua","Malumfashi","Mani","Mashi","Matazu","Musawa","Rimi","Sabuwa","Safana","Sandamu","Zango"] },
  { state: "Kebbi", lgas: ["Aleiro","Arewa-Dandi","Argungu","Augie","Bagudo","Birnin-Kebbi","Bunza","Dandi","Fakai","Gwandu","Jega","Kalgo","Koko-Besse","Maiyama","Ngaski","Sakaba","Shanga","Suru","Wasagu/Danko","Yauri","Zuru"] },
  { state: "Kogi", lgas: ["Adavi","Ajaokuta","Ankpa","Dekina","Ibaji","Idah","Igalamela-Odolu","Ijumu","Kabba/Bunu","Kogi","Lokoja","Mopa-Muro","Ofu","Ogori/Magongo","Okehi","Okene","Olamaboro","Omala","Oyi","Yagba-East","Yagba-West"] },
  { state: "Kwara", lgas: ["Asa","Baruten","Edu","Ekiti (Araromi/Opin)","Ilorin-East","Ilorin-South","Ilorin-West","Isin","Kaiama","Moro","Offa","Oke-Ero","Oyun","Pategi"] },
  { state: "Lagos", lgas: ["Agege","Ajeromi-Ifelodun","Alimosho","Amuwo-Odofin","Apapa","Badagry","Epe","Eti-Osa","Ibeju-Lekki","Ifako-Ijaiye","Ikeja","Ikorodu","Kosofe","Lagos-Island","Lagos-Mainland","Mushin","Ojo","Oshodi-Isolo","Shomolu","Surulere","Yewa-South"] },
  { state: "Nasarawa", lgas: ["Akwanga","Awe","Doma","Karu","Keana","Keffi","Kokona","Lafia","Nasarawa","Nasarawa-Eggon","Obi","Wamba","Toto"] },
  { state: "Niger", lgas: ["Agaie","Agwara","Bida","Borgu","Bosso","Chanchaga","Edati","Gbako","Gurara","Katcha","Kontagora","Lapai","Lavun","Magama","Mariga","Mashegu","Mokwa","Moya","Paikoro","Rafi","Rijau","Shiroro","Suleja","Tafa","Wushishi"] },
  { state: "Ogun", lgas: ["Abeokuta-North","Abeokuta-South","Ado-Odo/Ota","Ewekoro","Ifo","Ijebu-East","Ijebu-North","Ijebu-North-East","Ijebu-Ode","Ikenne","Imeko-Afon","Ipokia","Obafemi-Owode","Odeda","Odogbolu","Ogun-Waterside","Remo-North","Shagamu","Yewa North"] },
  { state: "Ondo", lgas: ["Akoko North-East","Akoko North-West","Akoko South-West","Akoko South-East","Akure-North","Akure-South","Ese-Odo","Idanre","Ifedore","Ilaje","Ile-Oluji-Okeigbo","Irele","Odigbo","Okitipupa","Ondo West","Ondo-East","Ose","Owo"] },
  { state: "Osun", lgas: ["Atakumosa West","Atakumosa East","Ayedaade","Ayedire","Boluwaduro","Boripe","Ede South","Ede North","Egbedore","Ejigbo","Ife North","Ife South","Ife-Central","Ife-East","Ifelodun","Ila","Ilesa-East","Ilesa-West","Irepodun","Irewole","Isokan","Iwo","Obokun","Odo-Otin","Ola Oluwa","Olorunda","Oriade","Orolu","Osogbo"] },
  { state: "Oyo", lgas: ["Afijio","Akinyele","Atiba","Atisbo","Egbeda","Ibadan North","Ibadan North-East","Ibadan North-West","Ibadan South-East","Ibadan South-West","Ibarapa-Central","Ibarapa-East","Ibarapa-North","Ido","Ifedayo","Irepo","Iseyin","Itesiwaju","Iwajowa","Kajola","Lagelu","Ogo-Oluwa","Ogbomosho-North","Ogbomosho-South","Olorunsogo","Oluyole","Ona-Ara","Orelope","Ori-Ire","Oyo-West","Oyo-East","Saki-East","Saki-West","Surulere"] },
  { state: "Plateau", lgas: ["Barkin-Ladi","Bassa","Bokkos","Jos-East","Jos-North","Jos-South","Kanam","Kanke","Langtang-North","Langtang-South","Mangu","Mikang","Pankshin","Qua'an Pan","Riyom","Shendam","Wase"] },
  { state: "Rivers", lgas: ["Abua/Odual","Ahoada-East","Ahoada-West","Akuku Toru","Andoni","Asari-Toru","Bonny","Degema","Eleme","Emuoha","Etche","Gokana","Ikwerre","Khana","Obio/Akpor","Ogba-Egbema-Ndoni","Ogu/Bolo","Okrika","Omuma","Opobo/Nkoro","Oyigbo","Port-Harcourt","Tai"] },
  { state: "Sokoto", lgas: ["Binji","Bodinga","Dange-Shuni","Gada","Goronyo","Gudu","Gwadabawa","Illela","Kebbe","Kware","Rabah","Sabon Birni","Shagari","Silame","Sokoto-North","Sokoto-South","Tambuwal","Tangaza","Tureta","Wamako","Wurno","Yabo"] },
  { state: "Taraba", lgas: ["Ardo-Kola","Bali","Donga","Gashaka","Gassol","Ibi","Jalingo","Karim-Lamido","Kurmi","Lau","Sardauna","Takum","Ussa","Wukari","Yorro","Zing"] },
  { state: "Yobe", lgas: ["Bade","Bursari","Damaturu","Fika","Fune","Geidam","Gujba","Gulani","Jakusko","Karasuwa","Machina","Nangere","Nguru","Potiskum","Tarmuwa","Yunusari","Yusufari"] },
  { state: "Zamfara", lgas: ["Anka","Bakura","Birnin Magaji/Kiyaw","Bukkuyum","Bungudu","Gummi","Gusau","Isa","Kaura-Namoda","Kiyawa","Maradun","Maru","Shinkafi","Talata-Mafara","Tsafe","Zurmi"] },
];

interface ExtendedUser {
  _id: string;
  surname: string;
  firstName: string;
  otherName: string;
  email: string;
  phone?: string;
  roles: UserRole[];
  activeRole: UserRole;
  profilePhoto?: string;
  // Student fields
  dateOfBirth?: string;
  gender?: string;
  currentClass?: { _id: string; name: string } | string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  religion?: string;
  stateOfOrigin?: string;
  localGovernment?: string;
  // Teacher fields
  qualification?: string;
  specialization?: string;
  // Parent fields
  occupation?: string;
  relationship?: string;
  children?: Array<{ _id: string; surname: string; firstName: string; otherName: string }> | string[];
}

interface Props {
  user: ExtendedUser;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditUserModal({ user, onClose, onSuccess }: Props) {
  const primaryRole = user.roles[0];
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user.profilePhoto ?? null);
  const [classes, setClasses] = useState<Array<{ _id: string; name: string }>>([]);
  const [students, setStudents] = useState<Array<{ _id: string; surname: string; firstName: string; otherName: string }>>([]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>(() => {
    if (!user.children) return [];
    return user.children.map((c) => typeof c === "string" ? c : c._id);
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAlsoParent, setIsAlsoParent] = useState(
    user.roles?.includes(UserRole.PARENT) ?? false
  );

  const [form, setForm] = useState({
    surname: user.surname ?? "",
    firstName: user.firstName ?? "",
    otherName: user.otherName ?? "",
    phone: user.phone ?? "",
    address: user.address ?? "",
    guardianName: user.guardianName ?? "",
    guardianPhone: user.guardianPhone ?? "",
    religion: user.religion ?? "",
    stateOfOrigin: user.stateOfOrigin ?? "",
    localGovernment: user.localGovernment ?? "",
    qualification: user.qualification ?? "",
    specialization: user.specialization ?? "",
    occupation: user.occupation ?? "",
    relationship: user.relationship ?? "",
    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "",
    gender: user.gender ?? "",
    currentClass: typeof user.currentClass === "object" && user.currentClass !== null
      ? user.currentClass._id
      : user.currentClass ?? "",
  });

  // Drive the LGA list from the form's stateOfOrigin (pre-populated on load)
  const availableLgas =
    nigeriaStates.find((s) => s.state === form.stateOfOrigin)?.lgas ?? [];

  useEffect(() => {
    fetch("/api/admin/classes")
      .then((r) => r.json())
      .then((j: { success: boolean; data?: Array<{ _id: string; name: string }> }) => {
        if (j.success && j.data) setClasses(j.data);
      });

    if (primaryRole === UserRole.PARENT || primaryRole === UserRole.TEACHER) {
      fetch("/api/admin/users?role=student&limit=100")
        .then((r) => r.json())
        .then((j: { success: boolean; data?: Array<{ _id: string; surname: string; firstName: string; otherName: string }> }) => {
          if (j.success && j.data) setStudents(j.data);
        });
    }
  }, [primaryRole]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return; }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      formData.append("folder", "school/profiles");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json() as { secure_url?: string; error?: { message: string } };
      if (data.secure_url) { setProfilePhoto(data.secure_url); toast.success("Photo uploaded"); }
      else { toast.error(data.error?.message ?? "Upload failed"); }
    } catch { toast.error("Upload failed"); }
    finally { setUploadingPhoto(false); }
  }

  function toggleChild(id: string) {
    setSelectedChildren((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        profilePhoto: profilePhoto ?? undefined,
      };
      if (primaryRole === UserRole.PARENT) {
        payload.children = selectedChildren;
      }

      if (primaryRole === UserRole.TEACHER) {
        if (isAlsoParent) {
          payload.roles = [UserRole.TEACHER, UserRole.PARENT];
          payload.children = selectedChildren;
        } else {
          payload.roles = [UserRole.TEACHER];
        }
      }

      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        toast.success("User updated successfully");
        onSuccess();
      } else {
        toast.error(json.error ?? "Failed to update user");
      }
    } catch { toast.error("Network error"); }
    finally { setIsLoading(false); }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;

    // When state changes, clear the LGA so stale value doesn't persist
    if (name === "stateOfOrigin") {
      setForm((prev) => ({ ...prev, stateOfOrigin: value, localGovernment: "" }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  const inputClass = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f]";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Edit User</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {user.surname} {user.firstName} {user.otherName} · {primaryRole}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#1e3a5f] hover:bg-gray-50 transition-all overflow-hidden group"
            >
              {uploadingPhoto ? (
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              ) : profilePhoto ? (
                <>
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <User className="w-8 h-8 text-gray-300" />
                  <Camera className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            <p className="text-xs text-gray-400">{profilePhoto ? "Click to change photo" : "Click to upload photo"}</p>
          </div>

          {/* Basic fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Surname *</label>
              <input name="surname" value={form.surname} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>First Name *</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Other Name</label>
              <input name="otherName" value={form.otherName} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email Address</label>
            <input
              value={user.email}
              disabled
              className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`}
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className={labelClass}>Phone Number</label>
            <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
          </div>

          {/* Student-specific fields */}
          {primaryRole === UserRole.STUDENT && (
            <>
              <div>
                <label className={labelClass}>Assign to Class</label>
                <select name="currentClass" value={form.currentClass} onChange={handleChange} className={inputClass}>
                  <option value="">Select class...</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Date of Birth</label>
                  <input
                    name="dateOfBirth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Gender</label>
                  <select name="gender" value={form.gender} onChange={handleChange} className={inputClass}>
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {/* Religion */}
              <div>
                <label className={labelClass}>Religion</label>
                <select name="religion" value={form.religion} onChange={handleChange} className={inputClass}>
                  <option value="">Select...</option>
                  <option value="christianity">Christianity</option>
                  <option value="islam">Islam</option>
                  <option value="traditional">Traditional</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* State of Origin */}
              <div>
                <label className={labelClass}>State of Origin</label>
                <select name="stateOfOrigin" value={form.stateOfOrigin} onChange={handleChange} className={inputClass}>
                  <option value="">Select state...</option>
                  {nigeriaStates.map((s) => (
                    <option key={s.state} value={s.state}>{s.state}</option>
                  ))}
                </select>
              </div>

              {/* Local Government Area — filtered by selected state */}
              <div>
                <label className={labelClass}>Local Government Area</label>
                <select
                  name="localGovernment"
                  value={form.localGovernment}
                  onChange={handleChange}
                  disabled={!form.stateOfOrigin}
                  className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed`}
                >
                  <option value="">
                    {form.stateOfOrigin ? "Select LGA..." : "Select a state first"}
                  </option>
                  {availableLgas.map((lga) => (
                    <option key={lga} value={lga}>{lga}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Guardian Name</label>
                <input name="guardianName" value={form.guardianName} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Guardian Phone</label>
                <input name="guardianPhone" value={form.guardianPhone} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <input name="address" value={form.address} onChange={handleChange} className={inputClass} />
              </div>
            </>
          )}

          {/* Teacher-specific fields */}
          {primaryRole === UserRole.TEACHER && (
            <>
              <div>
                <label className={labelClass}>Qualification</label>
                <input name="qualification" value={form.qualification} onChange={handleChange} placeholder="e.g. B.Ed, M.Sc" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Specialization</label>
                <input name="specialization" value={form.specialization} onChange={handleChange} placeholder="e.g. Mathematics, English" className={inputClass} />
              </div>
            </>
          )}

          {/* Teacher — also a parent toggle */}
          {primaryRole === UserRole.TEACHER && (
            <div className="border border-dashed border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Also a Parent?</p>
                  <p className="text-xs text-gray-400">Grant this teacher parent access to view their child&apos;s results</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAlsoParent(!isAlsoParent)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${isAlsoParent ? "bg-blue-600" : "bg-gray-200"}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isAlsoParent ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>

              {isAlsoParent && (
                <div>
                  <label className={labelClass}>Link Their Children</label>
                  <div className="border border-gray-200 rounded-xl max-h-[180px] overflow-y-auto divide-y divide-gray-50">
                    {students.length === 0 ? (
                      <p className="text-xs text-gray-400 p-3">No students found</p>
                    ) : (
                      students.map((s) => {
                        const isSelected = selectedChildren.includes(s._id);
                        return (
                          <div
                            key={s._id}
                            onClick={() => toggleChild(s._id)}
                            className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                          >
                            <span className="text-sm text-gray-700">
                              {s.surname} {s.firstName} {s.otherName}
                            </span>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Parent-specific fields */}
          {primaryRole === UserRole.PARENT && (
            <>
              <div>
                <label className={labelClass}>Occupation</label>
                <input name="occupation" value={form.occupation} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Relationship to Child</label>
                <select name="relationship" value={form.relationship} onChange={handleChange} className={inputClass}>
                  <option value="">Select...</option>
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="guardian">Guardian</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>
                  Linked Children <span className="text-gray-400 font-normal">(click to toggle)</span>
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
                          onClick={() => toggleChild(s._id)}
                          className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${isSelected ? "bg-[#1e3a5f]/5" : "hover:bg-gray-50"}`}
                        >
                          <span className="text-sm text-gray-700">{s.surname} {s.firstName} {s.otherName}</span>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "bg-[#1e3a5f] border-[#1e3a5f]" : "border-gray-300"}`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedChildren.length} child{selectedChildren.length !== 1 ? "ren" : ""} selected
                </p>
              </div>
            </>
          )}

          {/* Actions */}
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
                <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
              ) : (
                <><Save className="w-4 h-4" />Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}