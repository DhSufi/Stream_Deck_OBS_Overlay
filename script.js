const pointer1 = document.getElementById('pointer1');
const refPointer1 = document.getElementById('rectgradual');
let pointer1Active = false;

const pointer2 = document.getElementById('pointer2');
const refPointer2 = document.getElementById('bg2');
let pointer2Active = false;

// const frame = document.querySelectorAll('.frame');
const bg0 = document.getElementById("bg0");

const radios = document.getElementsByName('options');

let curItem = "main";

let hue= 300;
let saturation = 100;
let lightness = 26;


const copy1 = document.getElementById("copy1");


let items ={
    "main": {"hue": 300, "saturation": 100, "lightness": 26},
    "record": {"hue": 96, "saturation": 87, "lightness": 55},
    "country": {"hue": 241, "saturation": 81, "lightness": 55},
    "score": {"hue": 0, "saturation": 76, "lightness": 60},
    "glyphs": {"hue": 0, "saturation": 0, "lightness": 100},
}


radios.forEach(radio => {
    radio.addEventListener('change', (event) =>{
        curItem = event.target.value;
        hue = items[curItem].hue;
        saturation = items[curItem].saturation;
        lightness = items[curItem].lightness;

        updateColorbg0();
        updateColorItem();

        let newYPointer1 = myMap(hue, 0, 360, 0, 352) | 0;
        pointer1.style.top = newYPointer1 + "px";


        let newXPointer2 = myMap(saturation, 0, 100, 0, 412) | 0;
        let newYPointer2 = myMap(lightness, 0, (100-(saturation/2)), 352, 0) | 0;

        pointer2.style.top = newYPointer2 + "px";
        pointer2.style.left = newXPointer2 + "px";
    });
});



function setInit(){
    for (const item in items){
        let elements = document.querySelectorAll(`.${item}`);
        for (let i = 0; i < elements.length; i++){
            elements[i].style.fill = `hsl(${items[item]["hue"]} ${items[item]["saturation"]} ${items[item]["lightness"]})`;
        }
    }
    
    updateColorbg0();
    updateColorItem();
    
    let newYPointer1 = myMap(hue, 0, 360, 0, 352) | 0;
    pointer1.style.top = newYPointer1 + "px";
    
    let newXPointer2 = myMap(saturation, 0, 100, 0, 412) | 0;
    let newYPointer2 = myMap(lightness, 0, (100-(saturation/2)), 352, 0) | 0;
    
    pointer2.style.top = newYPointer2 + "px";
    pointer2.style.left = newXPointer2 + "px";
}



function myMap(value, fromLow, fromHigh, toLow, toHigh) {
    if (fromLow === fromHigh) {
        return;
    }
    return toLow + (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow);
}

function updateColorbg0() {
    bg0.style.backgroundColor = `hsl(${hue} 100 50)`;
}

function updateColorItem() {
    let elements = document.querySelectorAll(`.${curItem}`);

    for (let i = 0; i< elements.length; i++){
        elements[i].style.fill = `hsl(${hue} ${saturation} ${lightness})`;
    }
}

document.addEventListener('mousedown', function(event) {
    if (event.target == refPointer1){
        pointer1.style.top = event.layerY + "px";
        pointer1Active = true;

        hue = myMap(event.layerY, 0, 352, 0, 360) | 0;

        updateColorbg0();
        updateColorItem();
    }
    else if (event.target == refPointer2){
        pointer2.style.top = event.layerY + "px";
        pointer2.style.left = event.layerX + "px";
        pointer2Active = true;

        saturation = myMap(event.layerX, 0, 412, 0, 100) | 0;
        lightness = myMap(event.layerY, 352, 0, 0, (100-(saturation/2))) | 0;

        updateColorItem();
    }
});
document.addEventListener('mousemove', (event) => {
    if (pointer1Active){
        const mouseY = event.clientY;
        const refRect = pointer1.parentElement.getBoundingClientRect();
        let newTop = mouseY - (refRect.top | 0);
        if (newTop < 0){
            newTop = 0;
        }
        if (newTop > refRect.height){
            newTop = refRect.height;
        }

        hue = myMap(newTop, 0, 352, 0, 360) | 0;

        updateColorbg0();
        updateColorItem();

        requestAnimationFrame(() => {
            pointer1.style.top = `${newTop}px`;
        });
    }

    else if (pointer2Active){
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        const refRect = refPointer2.parentElement.getBoundingClientRect();
        
        let newLeft = mouseX - (refRect.left | 0);
        let newTop = mouseY - (refRect.top | 0);
        if (newTop < 0){
            newTop = 0;
        }
        else if (newTop > refRect.height){
            newTop = refRect.height;
        }

        if (newLeft < 0){
            newLeft = 0;
        }
        else if (newLeft > refRect.width){
            newLeft = refRect.width;
        }

        saturation = myMap(newLeft, 0, 412, 0, 100) | 0;
        lightness = myMap(newTop, 352, 0, 0, (100-(saturation/2))) | 0;

        updateColorItem();

        requestAnimationFrame(() => {
            pointer2.style.left = `${newLeft}px`;
            pointer2.style.top = `${newTop}px`;
        });
    }
});

document.addEventListener('mouseup', function(event) {
    pointer1Active = false;
    pointer2Active = false;
    items[curItem].hue = hue;
    items[curItem].saturation = saturation;
    items[curItem].lightness = lightness;
});


copy1.addEventListener("mouseleave", function() {
    copy1.innerHTML = "COPY STYLE";
});

copy1.addEventListener("click", function() {
    let text = `
:root {
    --overlayA-color: hsl(${items.main.hue} ${items.main.saturation} ${items.main.lightness});
    --brecordA-color: hsl(${items.record.hue} ${items.record.saturation} ${items.record.lightness});
    --bcountryA-color: hsl(${items.country.hue} ${items.country.saturation} ${items.country.lightness});
    --bscoreA-color: hsl(${items.score.hue} ${items.score.saturation} ${items.score.lightness});
    --bitemA1-color: hsl(${items.glyphs.hue} ${items.glyphs.saturation} ${items.glyphs.lightness});
    --bitemB1-color: hsl(${items.glyphs.hue} ${items.glyphs.saturation} ${items.glyphs.lightness});
    --textnameA-color: hsl(${items.glyphs.hue} ${items.glyphs.saturation} ${items.glyphs.lightness});
    --textscoreA-color: hsl(${items.glyphs.hue} ${items.glyphs.saturation} ${items.glyphs.lightness});
    --textcountryA-color: hsl(${items.glyphs.hue} ${items.glyphs.saturation} ${items.glyphs.lightness});
    --textrecordA-color: hsl(${items.glyphs.hue} ${items.glyphs.saturation} ${items.glyphs.lightness});
    --separatorA1-color: hsl(${items.glyphs.hue} ${items.glyphs.saturation} ${items.glyphs.lightness});
    --separatorB1-color: hsl(${items.glyphs.hue} ${items.glyphs.saturation} ${items.glyphs.lightness});
    --bstatusA1-color: hsl(${items.glyphs.hue} ${items.glyphs.saturation} ${items.glyphs.lightness});
    --bstatusB1-color: hsl(${items.glyphs.hue} ${items.glyphs.saturation} ${items.glyphs.lightness});
}
`
    navigator.clipboard.writeText(text);
    copy1.innerHTML = "STYLE COPIED!!";
});

setInit();