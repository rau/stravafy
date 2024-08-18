import { getFirestore } from "firebase/firestore"
import { firebase } from "@/libs/firebase"

const db = getFirestore(firebase)
export default db
