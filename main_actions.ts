import streamDeck, { 
	action,
	KeyDownEvent,
	SingletonAction,
	WillAppearEvent,
	WillDisappearEvent,
	DidReceiveSettingsEvent,
	PropertyInspectorDidAppearEvent,
	DidReceiveGlobalSettingsEvent } from "@elgato/streamdeck";
import { Koffing } from './Koffing';
import TPokes from './TranslatorPokes';
import TItems from './TranslatorItems';
import WebSocket from "ws";
import crypto from 'crypto';


var images: { [key: string]: any } = {};
var items: { [key: string]: any } = {};
var displays: { [key: string]: any } = {};
var actionSlots: { [key: string]: any } = {};
let curInput = "";
let curSlot = "";
var slotsA: { [key: string]: any } = {"1": "", "2": "", "3": "", "4": ""};
var slotsB: { [key: string]: any } = {"1": "", "2": "", "3": "", "4": ""};


let glbset: any = {};
streamDeck.settings.onDidReceiveGlobalSettings(async (ev: DidReceiveGlobalSettingsEvent<any>) => {
	glbset = ev.settings;
	ws?.close();
	console.log("===== Global Settings received: ", ev.settings);
});


let ws: WebSocket | null = null;
let curStatus: number = 0;
let prevStatus: number = 0;
let messageTimeout: any = null;

function handleMessage(msg: any): void {
	let prefRV = 1;
	if (msg.op === 0) {
		if (msg.d.authentication) {
			const step1 = glbset.password + msg.d.authentication.salt;
			const hash = crypto.createHash('sha256').update(step1).digest('base64');
			const step2 = hash + msg.d.authentication.challenge;
			const authString = crypto.createHash('sha256').update(step2).digest('base64');

			let data = {
				rpcVersion: prefRV,
				authentication: authString,
				eventSubscriptions: 0
			}

			ws?.send(JSON.stringify({op: 1, d: data}));
		}
		else {
			ws?.send(JSON.stringify({op: 1, d: {rpcVersion: prefRV, eventSubscriptions: 0}}));
		}
	}
	else if (msg.op === 2){
		if (msg.d.negotiatedRpcVersion === prefRV) {
			streamDeck.ui.current?.sendToPropertyInspector({ event: "loginSuccess" });
			streamDeck.actions.forEach(async (action) => {
				if (action.manifestId === "com.dhsufi.hello-world.controls"){
					const set = await action.getSettings();
					action.setImage(`imgs/actions/controls/${set.control}.svg`);
				}
				else{
					action.setImage("");
				}
				
			});
			curStatus = 3;
			if (messageTimeout) {
				clearTimeout(messageTimeout);
			}
		}
		else {
			ws?.close();
		}
	}
}

function connectWebSocket(): void {
	if (glbset.ip && glbset.port) {

		if (curStatus === 3){
			streamDeck.actions.forEach(async (action) => {
				action.setImage("imgs/actions/general/disconnection.svg");
			});
		}
		curStatus = 1;
		if (curStatus !== prevStatus){
			streamDeck.actions.forEach(async (action) => {
				action.setImage("imgs/actions/general/disconnection.svg");
			});
			prevStatus = curStatus;
		}

		ws = new WebSocket(`ws://${glbset.ip}:${glbset.port}`);
		console.log('===== Connecting to WebSocket...');

		ws.on('open', function open() {
			console.log("===== WebSocket connected");
			messageTimeout = setTimeout(() => {
				console.log("===== No handshake completed in 10 seconds, closing WebSocket");
				ws?.close();
			}, 10000);
		});

		ws.on('message', function incoming(data) {
			console.log("===== WebSocket received: ", data.toString());
			handleMessage(JSON.parse(data.toString()));
		});

		ws.on('close', function close() {
			streamDeck.ui.current?.sendToPropertyInspector({ event: "loginFailed" });
			if (messageTimeout) {
				clearTimeout(messageTimeout);
			}
			ws = null;
			setTimeout(() => {connectWebSocket()}, 1000);
			console.log("===== WebSocket closed");
		});

		ws.on('error', function error(err) {
			ws?.close();
		});
	}
	else {
		curStatus = 2;
		if (curStatus !== prevStatus){
			streamDeck.actions.forEach(async (action) => {
				action.setImage("imgs/actions/general/nokey.svg");
			});
			prevStatus = curStatus;
		}
		console.log("===== No GLOBALSETTINGS");
		setTimeout(() => {connectWebSocket()}, 1000);
	}
}

async function fetchData(url: string): Promise<any> {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching POKEPASTE:', error);
    }
}

function sendObsMsg(eventName: string, eventData: object = {}){
	const mymsg = {
		"op": 6,
		"d": {
			"requestType": "CallVendorRequest",
			"requestId": "f819dcf0-89cc-1111-8f0e-382c4ac93b9c",
			"requestData": {
				'vendorName': 'obs-browser',
				'requestType': 'emit_event',
				'requestData': {
					'event_name': eventName,
					'event_data': eventData
				}
			}
		}
	};
	ws?.send(JSON.stringify(mymsg));
}


async function updateImages(player:string, paste:string) {
	if (paste.indexOf("https://pokepast.es/") == 0) {
		const data = await fetchData(paste);
		const parsedTeam = Koffing.parse(data.paste).toJson();
		const team = JSON.parse(parsedTeam);
		const pokes = team.teams[0].pokemon;
		for (let i = 0; i < pokes.length; i++) {
			let poke = pokes[i].name;
			let item = pokes[i].item;
			images[`${player}${i+1}`] = TPokes[poke] + ".png";
			items[`${player}${i+1}`] = TItems[item] + ".png";
			// TODO XD ITEM
		}
	}
	else {
		for (let i = 0; i < 6; i++) {
			images[`${player}${i+1}`] = "";
			items[`${player}${i+1}`] = "";
		}
	}
}


connectWebSocket();


@action({ UUID: "com.dhsufi.hello-world.poke" })
export class Poke extends SingletonAction {

	override async onWillAppear(ev: WillAppearEvent): Promise<void>  {
		if (!glbset.ip || !glbset.port) {
			ev.action.setImage("imgs/actions/general/nokey.svg");
		}
		else if (!ws) {
			ev.action.setImage("imgs/actions/general/disconnection.svg");
		}
		else {
			const settings = ev.payload.settings;
			if (settings.spot && typeof settings.spot === 'string' && images[settings.spot]) {
				ev.action.setImage(`imgs/actions/Icons/${images[settings.spot]}`);
			} else {
				ev.action.setImage("");
			}
		}
	}

	override async onPropertyInspectorDidAppear(ev: PropertyInspectorDidAppearEvent): Promise<void> {
		if (!glbset.ip || !glbset.port) {
			streamDeck.ui.current?.sendToPropertyInspector({ event: "openLogin" });
		}
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent): Promise<void> {
		
		if (ev.payload.settings.spot && typeof ev.payload.settings.spot === 'string' && images[ev.payload.settings.spot]) {
			ev.action.setImage(`imgs/actions/Icons/${images[ev.payload.settings.spot]}`);
		}
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		if (!ws){
			return;
		}

		if (ev.payload.settings.spot && typeof ev.payload.settings.spot === 'string'){
			if (ev.payload.settings.spot.includes("A") ){
				for (const key in slotsA) {
					if (slotsA[key] === images[ev.payload.settings.spot]) {
						return;
					}
				}

				for (const key in slotsA) {
					if (slotsA[key] === "") {
						slotsA[key] = images[ev.payload.settings.spot];

						sendObsMsg("slot_show", {"slot": `A${key}`, "poke": images[ev.payload.settings.spot], "item": items[ev.payload.settings.spot]});

						for (const [_, pair] of Object.entries(actionSlots)) {
							const [[slot, action]] = Object.entries(pair);
							if (slot === `A${key}`){
								(action as any).setImage(`imgs/actions/Icons/${slotsA[key]}`);
							}
						}
						return;
					}
				}
			}
			else if (ev.payload.settings.spot.includes("B") ){
				for (const key in slotsB) {
					if (slotsB[key] === images[ev.payload.settings.spot]) {
						return;
					}
				}
				for (const key in slotsB) {
					if (slotsB[key] === "") {
						slotsB[key] = images[ev.payload.settings.spot];

						sendObsMsg("slot_show", {"slot": `B${key}`, "poke": images[ev.payload.settings.spot], "item": items[ev.payload.settings.spot]});

						for (const [_, pair] of Object.entries(actionSlots)) {
							const [[slot, action]] = Object.entries(pair);
							if (slot === `B${key}`){
								(action as any).setImage(`imgs/actions/Icons/${slotsB[key]}`)
							}
						}
						return;
					}
				}
			}
		}
	}
}

@action({ UUID: "com.dhsufi.hello-world.slot" })
export class Slot extends SingletonAction {

	override async onWillAppear(ev: WillAppearEvent): Promise<void> {
		if (!glbset.ip || !glbset.port) {
			ev.action.setImage("imgs/actions/general/nokey.svg");
		}
		else if (!ws) {
			ev.action.setImage("imgs/actions/general/disconnection.svg");
		}
		else {
			if (ev.payload.settings.spot && typeof ev.payload.settings.spot === 'string') {
				if (ev.payload.settings.spot.includes("A")){
					let idx = ev.payload.settings.spot.replace("A", "");
					ev.action.setImage(`imgs/actions/icons/${slotsA[idx]}`);
				}
				else if (ev.payload.settings.spot.includes("B")){
					let idx = ev.payload.settings.spot.replace("B", "");
					ev.action.setImage(`imgs/actions/icons/${slotsB[idx]}`);
				}
			}			
		}
		actionSlots[ev.action.id] = {[String(ev.payload.settings.spot)]: ev.action};
	}

	override async onWillDisappear(ev: WillDisappearEvent): Promise<void> {
		delete actionSlots[ev.action.id];
	}

	override async onPropertyInspectorDidAppear(ev: PropertyInspectorDidAppearEvent): Promise<void> {
		if (!glbset.ip || !glbset.port) {
			streamDeck.ui.current?.sendToPropertyInspector({ event: "openLogin" });
		}
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent): Promise<void> {
		actionSlots[ev.action.id] = {[String(ev.payload.settings.spot)]: ev.action};
		if (ev.payload.settings.spot && typeof ev.payload.settings.spot === 'string') {
			if (ev.payload.settings.spot.includes("A")){
				let idx = ev.payload.settings.spot.replace("A", "");
				ev.action.setImage(`imgs/actions/icons/${slotsA[idx]}`);
			}
			else if (ev.payload.settings.spot.includes("B")){
				let idx = ev.payload.settings.spot.replace("B", "");
				ev.action.setImage(`imgs/actions/icons/${slotsB[idx]}`);
			}
		}	
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		if (!ws || !ev.payload.settings.spot){
			return;
		}
		else {
			if (ev.payload.settings.spot && typeof ev.payload.settings.spot === 'string') {
				if (ev.payload.settings.spot.includes("A")){
					let idx = ev.payload.settings.spot.replace("A", "");
					if (slotsA[idx] === ""){
						return
					}
				}
				else if (ev.payload.settings.spot.includes("B")){
					let idx = ev.payload.settings.spot.replace("B", "");
					if (slotsB[idx] === ""){
						return
					}
				}
			}
		}
		curSlot = String(ev.payload.settings.spot);
		streamDeck.profiles.switchToProfile(ev.action.device.id, "profiles/MyTest", 1);
	}
}



@action({ UUID: "com.dhsufi.hello-world.updater" })
export class Updater extends SingletonAction {

	override async onWillAppear(ev: WillAppearEvent): Promise<void>  {
		if (!glbset.ip || !glbset.port) {
			ev.action.setImage("imgs/actions/general/nokey.svg");
		}
		else if (!ws) {
			ev.action.setImage("imgs/actions/general/disconnection.svg");
		}
		else {
			ev.action.setImage("");
		}
	}

	override async onPropertyInspectorDidAppear(ev: PropertyInspectorDidAppearEvent): Promise<void> {
		if (!glbset.ip || !glbset.port) {
			streamDeck.ui.current?.sendToPropertyInspector({ event: "openLogin" });
		}
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		if (!ws){
			return;
		}

		// Reset slots
		slotsA = {"1": "", "2": "", "3": "", "4": ""};
		slotsB = {"1": "", "2": "", "3": "", "4": ""};
		for (const [_, pair] of Object.entries(actionSlots)) {
			const [[_, action]] = Object.entries(pair);
				(action as any).setImage("");
		}

		for (const [key, value] of Object.entries(ev.payload.settings)) {
			console.log(`Key: ${key}, Value: ${value}`);
		}

		await updateImages("A", String(ev.payload.settings.pasteA)+"/json");
		await updateImages("B", String(ev.payload.settings.pasteB)+"/json");

		streamDeck.actions.forEach(async (action) => {
			if (action.manifestId === "com.dhsufi.hello-world.poke") {
				const settings = await action.getSettings();
				if (settings.spot && typeof settings.spot === 'string' && images[settings.spot]) {
					action.setImage(`imgs/actions/Icons/${images[settings.spot]}`);
				}
			}
		});


		sendObsMsg("details", ev.payload.settings);
	}	
}


@action({ UUID: "com.dhsufi.hello-world.controls" })
export class Controls extends SingletonAction {

	override async onWillAppear(ev: WillAppearEvent): Promise<void> {
		if (!glbset.ip || !glbset.port) {
			ev.action.setImage("imgs/actions/general/nokey.svg");
		}
		else if (!ws) {
			ev.action.setImage("imgs/actions/general/disconnection.svg");
		}
		else {
			ev.action.setImage(`imgs/actions/controls/${ev.payload.settings.control}.svg`);
		}
	}

	override async onPropertyInspectorDidAppear(ev: PropertyInspectorDidAppearEvent): Promise<void> {
		if (!glbset.ip || !glbset.port) {
			streamDeck.ui.current?.sendToPropertyInspector({ event: "openLogin" });
		}
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent): Promise<void> {
		ev.action.setImage(`imgs/actions/controls/${ev.payload.settings.control}.svg`);
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		if (!ws){
			return;
		}

		if (typeof ev.payload.settings.control === 'string'){
			sendObsMsg("controls", {data: ev.payload.settings.control});
		}
	}
}


@action({ UUID: "com.dhsufi.hello-world.uinput" })
export class uInput extends SingletonAction {

	override async onWillAppear(ev: WillAppearEvent): Promise<void> {
		if (!glbset.ip || !glbset.port) {
			ev.action.setImage("imgs/actions/general/nokey.svg");
		}
		else if (!ws) {
			ev.action.setImage("imgs/actions/general/disconnection.svg");
		}
		else{
			if (ev.payload.settings.uinput === "/") {
				ev.action.setImage(`imgs/actions/uinput/slash.svg`);
			}
			else {
				ev.action.setImage(`imgs/actions/uinput/${ev.payload.settings.uinput}.svg`);
			}

			if (ev.payload.settings.uinput === "display"){
				displays[ev.action.id] = ev.action;
				curInput = "";
				ev.action.setTitle(curInput);
			}
		}
	}

	override async onWillDisappear(ev: WillDisappearEvent): Promise<void> {
		if (ev.payload.settings.uinput === "display") {
			delete displays[ev.action.id];
		}
	}

	override async onPropertyInspectorDidAppear(ev: PropertyInspectorDidAppearEvent): Promise<void> {
		if (!glbset.ip || !glbset.port) {
			streamDeck.ui.current?.sendToPropertyInspector({ event: "openLogin" });
		}
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent): Promise<void> {
		
		if (ev.payload.settings.uinput && typeof ev.payload.settings.uinput === 'string') {
			
			if (ev.payload.settings.uinput === "/") {
				ev.action.setImage(`imgs/actions/uinput/slash.svg`);
			}
			else {
				ev.action.setImage(`imgs/actions/uinput/${ev.payload.settings.uinput}.svg`);
			}

			if (ev.payload.settings.uinput === "display"){
				displays[ev.action.id] = ev.action;
			}
		}
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		if (!ws){
			return;
		}
		console.log(ev.payload.settings.uinput);
		const regex = /^[0-9\/]$/;
		if (typeof ev.payload.settings.uinput === 'string' && regex.test(ev.payload.settings.uinput)) {
			curInput = curInput + ev.payload.settings.uinput;
			if (ev.payload.settings.uinput === "/"){
				curInput = curInput + "\n";
			}

			for (const display of Object.values(displays)) {
				display.setTitle(curInput);
			}
		}
		else if (typeof ev.payload.settings.uinput === 'string' && ev.payload.settings.uinput === "delete"){
			curInput = curInput.trim().slice(0, -1);
			for (const display of Object.values(displays)) {
				display.setTitle(curInput);
			}
		}
		else if (typeof ev.payload.settings.uinput === 'string' && ev.payload.settings.uinput === "cancel"){
			curInput = "";
			for (const display of Object.values(displays)) {
				display.setTitle(curInput);
			}
			streamDeck.profiles.switchToProfile(ev.action.device.id, "");
		}
		else if (typeof ev.payload.settings.uinput === 'string' && ev.payload.settings.uinput === "display"){
			const security = /^(?!.*\/.*\/)[0-9\/\n]+$/;
			if (!security.test(curInput.trim())) {
				return;
			}
			const [numerator, denominator] = curInput.trim().split("/").map(Number);
			const result = numerator / denominator;

			sendObsMsg("slot_hp", {slot: curSlot, hp: result});
		}
		else if (typeof ev.payload.settings.uinput === 'string' && ev.payload.settings.uinput.includes("Status")){
			
			const stts = ev.payload.settings.uinput.replace("Status", "");
			sendObsMsg("status", {slot: curSlot, status: stts});
		}
		else if (typeof ev.payload.settings.uinput === 'string' && ev.payload.settings.uinput === "faint"){
			sendObsMsg("faint", {slot: curSlot});
		}
		else if (typeof ev.payload.settings.uinput === 'string' && ev.payload.settings.uinput === "reset"){
			
			sendObsMsg("slot_reset", {slot: curSlot});
			
			if (curSlot.includes("A")) {
				curSlot = curSlot.slice(1);
				slotsA[curSlot] = "";
			} else if (curSlot.includes("B")) {
				curSlot = curSlot.slice(1);
				slotsB[curSlot] = "";
			}
			
			streamDeck.profiles.switchToProfile(ev.action.device.id, "");

		}
	}

}




// https://pokepast.es/8fc32f7bfb51088c
// https://pokepast.es/3f5a3379ac991a00