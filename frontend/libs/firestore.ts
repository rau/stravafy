import { getFirestore } from "firebase/firestore"
import firebaseApp from "@/libs/firebase"

const db = getFirestore(firebaseApp)
export default db
