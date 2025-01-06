window.addEventListener('controls', (event) => {
    console.log(event.detail['data']);
    if (event.detail['data'] === "show"){
        let pa = document.querySelector('.player.A');
        let classListA = pa.classList;
        let pb = document.querySelector('.player.B');
        let classListB = pb.classList;

        if (classListA.contains("stage1")){
            pa.classList.remove("stage1");
            pa.classList.add("stage0");
        }
        else if (classListA.contains("stage0")){
            pa.classList.remove("stage0");
            pa.classList.add("stage1");
        }
        else{
            pa.classList.add("stage1");
        }

        if (classListB.contains("stage1")){
            pb.classList.remove("stage1");
            pb.classList.add("stage0");
        }
        else if (classListB.contains("stage0")){
            pb.classList.remove("stage0");
            pb.classList.add("stage1");
        }
        else{
            pb.classList.add("stage1");
        }
    }
    else if (event.detail['data'] === "AP"){
        let score = document.querySelector(".score.A text");
        let res = Number(score.innerHTML) + 1;
        score.innerHTML = res;
    }
    else if (event.detail['data'] === "AS"){
        let score = document.querySelector(".score.A text");
        let res = Number(score.innerHTML) - 1;
        score.innerHTML = res;
    }
    else if (event.detail['data'] === "BP"){
        let score = document.querySelector(".score.B text");
        let res = Number(score.innerHTML) + 1;
        score.innerHTML = res;
    }
    else if (event.detail['data'] === "BS"){
        let score = document.querySelector(".score.B text");
        let res = Number(score.innerHTML) - 1;
        score.innerHTML = res;
    }
    else if (event.detail['data'] === "reset"){
        let scoreA = document.querySelector(".score.A text");
        let scoreB = document.querySelector(".score.B text");
        scoreA.innerHTML = 0;
        scoreB.innerHTML = 0;
    }
});


window.addEventListener('slot_show', (event) => {
    console.log(event.detail);
    let slot = event.detail["slot"];
    let imgpoke = event.detail["poke"];
    let imgitem = event.detail["item"];

    let poke = document.querySelector(`.${slot[0]} .poke.n${slot[1]} .sprite`);
    poke.setAttribute('href', `./Resources/PokeIcons/${imgpoke}`);

    let item = document.querySelector(`.${slot[0]} .item.n${slot[1]} image`);
    item.setAttribute('href', `./Resources/ItemsIcons/${imgitem}`);

    let elem = document.querySelector(`.${slot[0]} .slot.n${slot[1]}`);
    if (elem.classList.contains("show0")){
        elem.classList.remove("show0");
    }
    elem.classList.add("show1");

    let hp = document.querySelector(`.${slot[0]} .hp.n${slot[1]}`);
    hp.style.transform = `translate(0, 0)`;
    hp.style.fill = "#22a727";

});


window.addEventListener('details', (event) => {
    console.log(event.detail);

    const recordA = document.querySelector(".record.A text");
    const countryA = document.querySelector(".country.A text");
    const nameA = document.querySelector(".name.A text");
    const scoreA = document.querySelector(".score.A text");

    recordA.innerHTML = event.detail.recordA;
    countryA.innerHTML = event.detail.countryA;
    nameA.innerHTML = event.detail.nameA;
    scoreA.innerHTML = 0;

    const recordB = document.querySelector(".record.B text");
    const countryB = document.querySelector(".country.B text");
    const nameB = document.querySelector(".name.B text");
    const scoreB = document.querySelector(".score.B text");

    recordB.innerHTML = event.detail.recordB;
    countryB.innerHTML = event.detail.countryB;
    nameB.innerHTML = event.detail.nameB;
    scoreB.innerHTML = 0;

    const players = document.querySelectorAll('.player');
    players.forEach(element => {
        element.classList.forEach(cls => {
        if (cls.includes("stage")) {
            element.classList.remove(cls);
        }
        });
    });
    const slots = document.querySelectorAll('.slot');
    slots.forEach(element => {
        element.classList.forEach(cls => {
        if (cls.includes("show") || cls.includes("fainted")) {
            element.classList.remove(cls);
        }
        });
    });
    const status = document.querySelectorAll('.status');
    status.forEach(element => {
        element.classList.forEach(cls => {
        if (cls.includes("active")) {
            element.classList.remove(cls);
        }
        });
    });
    
});


window.addEventListener('slot_reset', (event) => {
    let slot = event.detail["slot"];
    let elem = document.querySelector(`.${slot[0]} .slot.n${slot[1]}`);
    if (elem.classList.contains("show1")){
        elem.classList.remove("show1");
    }
    elem.classList.add("show0");
    elem.classList.remove("fainted");

    let stts = document.querySelector(`.${slot[0]} .status.n${slot[1]}`);
    stts.classList.remove("active");
    stts.classList.remove("inactive");
});

window.addEventListener('status', (event) => {
    let slot = event.detail["slot"];
    let newStatus = event.detail["status"];

    let elem = document.querySelector(`.${slot[0]} .status.n${slot[1]}`);
    let img = document.querySelector(`.${slot[0]} .status.n${slot[1]} image`);
    let currStatus = img.getAttribute("href");
    let index = currStatus.lastIndexOf("/");
    currStatus = currStatus.slice(index+1, currStatus.length - 4);

    if (currStatus == newStatus){
        if (elem.classList.contains("active")){
            elem.classList.remove("active");
            elem.classList.add("inactive");
        }
        else if (elem.classList.contains("inactive")){
            elem.classList.remove("inactive");
            elem.classList.add("active");
        }
        else{
            elem.classList.add("active");
        }
    }
    else{
        img.setAttribute('href', `./Resources/StatusIcons/${newStatus}.png`);
        elem.classList.remove("inactive");
        elem.classList.add("active");
    }
});




window.addEventListener('slot_hp', (event) => {
    let slot = event.detail["slot"];
    let elem = document.querySelector(`.${slot[0]} .hp.n${slot[1]}`);
    let curValue = event.detail["hp"];
    curValue = (62 * (1-curValue)) + 4;
    if (curValue <= 4){
        curValue = 0;
    }
    else if (curValue >= 66){
        curValue = 70;
    }

    elem.style.transform = `translate(0, ${curValue}px)`;
    console.log(curValue);
    if(curValue<=35){
        elem.style.fill = "#22a727";
    }
    else if (curValue<=53){
        elem.style.fill = "#d6cb2d";
    }
    else{
        elem.style.fill = "#d11e15";
    }
});


window.addEventListener('faint', (event) => {
    let slot = event.detail["slot"];
    let elem = document.querySelector(`.${slot[0]} .slot.n${slot[1]}`);

    if (elem.classList.contains("fainted")){
        elem.classList.remove("fainted");
    }
    else {
        elem.classList.add("fainted");
        let stts = document.querySelector(`.${slot[0]} .status.n${slot[1]}`);
        if (stts.classList.contains("active")){
            stts.classList.remove("active");
            stts.classList.add("inactive");
        }
    }

});