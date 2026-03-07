import { db } from "./firebase.js";

import {
collection,
getDocs,
addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ventureTable = document.getElementById("ventureTable");

async function loadVentures(){

const querySnapshot = await getDocs(collection(db,"ventures"));

ventureTable.innerHTML="";

querySnapshot.forEach((doc)=>{

const data = doc.data();

ventureTable.innerHTML += `
<tr>
<td><a href="venture.html?id=${doc.id}">${data.name}</a></td>
<td>${data.currentObjective || ""}</td>
<td>${data.weeklyOutcome || ""}</td>
<td>${data.keyMetric || ""}</td>
<td>${data.state || ""}</td>
</tr>
`;

});

}

loadVentures();

window.addVenture = async function(){

const name = document.getElementById("ventureName").value;

await addDoc(collection(db,"ventures"),{
name:name,
state:"Active"
});

location.reload();

}
