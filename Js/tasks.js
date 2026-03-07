import { db } from "./firebase.js";

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const taskTable = document.getElementById("taskTable");

async function loadTasks(){

const querySnapshot = await getDocs(collection(db,"tasks"));

querySnapshot.forEach((doc)=>{

const data = doc.data();

taskTable.innerHTML += `
<tr>
<td>${data.title}</td>
<td>${data.completed ? "Done" : "Pending"}</td>
</tr>
`;

});

}

loadTasks();
