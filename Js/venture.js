import { db } from "./firebase.js";

import {
collection,
addDoc,
getDocs,
query,
where,
updateDoc,
doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const ventureId = params.get("id");

const taskList = document.getElementById("taskList");

async function loadTasks(){

const q = query(collection(db,"tasks"), where("ventureId","==",ventureId));

const querySnapshot = await getDocs(q);

taskList.innerHTML="";

querySnapshot.forEach((task)=>{

const data = task.data();

taskList.innerHTML += `
<li>
<input type="checkbox" ${data.completed?"checked":""}
onclick="markDone('${task.id}')">

${data.title}

</li>
`;

});

}

loadTasks();

window.addTask = async function(){

const title = document.getElementById("taskInput").value;

await addDoc(collection(db,"tasks"),{
title:title,
ventureId:ventureId,
completed:false,
createdAt:Date.now()
});

loadTasks();

}

window.markDone = async function(id){

await updateDoc(doc(db,"tasks",id),{
completed:true
});

loadTasks();

}
