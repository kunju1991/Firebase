sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast"
], function (Controller, MessageToast) {
	"use strict";

	return Controller.extend("com.demo.FirebaseChat.controller.MainView", {

		onInit: function () {

			// Your web app's Firebase configuration
			var firebaseConfig = {
				apiKey: "AIzaSyATJyR8xu78HKBoxIH_13hmWoEeJb3UUVA",
				authDomain: "firstfirebase-e4bd3.firebaseapp.com",
				databaseURL: "https://firstfirebase-e4bd3.firebaseio.com",
				projectId: "firstfirebase-e4bd3",
				storageBucket: "firstfirebase-e4bd3.appspot.com",
				messagingSenderId: "354153001965",
				appId: "1:354153001965:web:388fdddc16307a6c"
			};
			// Initialize Firebase
			firebase.initializeApp(firebaseConfig);
		},

		onLogin: function () {
			var sUser = this.getView().byId("email").getValue();
			var sPassword = this.getView().byId("password").getValue();
			var that = this;
			firebase.auth().onAuthStateChanged(function (user) {
				if (user) {
					MessageToast.show("Login was successfully!");
					that._getUsers();
				}
			});
			firebase.auth().signInWithEmailAndPassword(sUser, sPassword).catch(function () {
				MessageToast.show("Login not possible!");
			});
		},

		onSelectUser: function (oEvent) {
			var oSource = oEvent.getSource();
			var sSelectedEmail = oSource.getSelectedKey();
			var sChat = "";
			var sEmail = firebase.auth().currentUser.email;
			var oUserModel = this.getView().getModel("userModel");
			var aUsers = oUserModel.getProperty("/users");
			var that = this;
			aUsers.forEach(function (oUser) {
				if (oUser.email === sEmail) {
					var oChats = oUser.chats;
					if (oChats) {
						Object.keys(oChats).forEach(function (sKey) {
							if (oChats[sKey].email === sSelectedEmail) {
								sChat = oChats[sKey].chat;
							}
						});
					}
				}
			});
			if (!sChat) {
				var sCurrentUserGuid = "";
				var sSelectedUserGuid = "";
				aUsers.forEach(function (oUser) {
					if (oUser.email === sEmail) {
						sCurrentUserGuid = oUser.guid;
					}
					if (oUser.email === sSelectedEmail) {
						sSelectedUserGuid = oUser.guid;
					}
				});
				var sChatGuid = this._createGUID();
				var sCurrentUserChatKey = this._createGUID();
				var sSelectedUserChatKey = this._createGUID();
				firebase.database().ref("/users/" + sCurrentUserGuid + "/chats/" + sCurrentUserChatKey).set({
					chat: sChatGuid,
					email: sSelectedEmail
				});
				firebase.database().ref("/users/" + sSelectedUserGuid + "/chats/" + sSelectedUserChatKey).set({
					chat: sChatGuid,
					email: sEmail
				});
				var sFirstMessageGuid = this._createGUID();
				sChat = sChatGuid;
				var newMessageTimestamp = Date.now();
				firebase.database().ref("/chats/" + sChatGuid + "/" + sFirstMessageGuid).set({
					message: {
						email: "admin",
						text: "Welcome!",
						timestamp: newMessageTimestamp
					}
				});
			}
			var oRefToChatData = firebase.database().ref("/chats/" + sChat);
			oRefToChatData.on("value", function (oSnapshot) {
				var mChatData = oSnapshot.toJSON();
				var aChatData = $.map(mChatData, function (oElement, sGuid) {
					oElement.guid = sGuid;
					return oElement;
				});
				var oChatModel = new sap.ui.model.json.JSONModel({});
				oChatModel.setProperty("/guid", sChat);
				oChatModel.setProperty("/chats", aChatData);
				that.getView().setModel(oChatModel, "chatModel");
				that.getView().byId("chatTable").getBinding("items").sort(new sap.ui.model.Sorter("message/timestamp", false));
			});
		},

		onSendNewMessage: function () {
			if (this.getView().getModel("chatModel")) {
				var sChatGuid = this.getView().getModel("chatModel").getProperty("/guid");
				var sNewMessageText = this.getView().byId("newMessage").getValue();
				var sNewMessageGuid = this._createGUID();
				var newMessageTimestamp = Date.now();
				var newMessageEmail = firebase.auth().currentUser.email;
				firebase.database().ref("/chats/" + sChatGuid + "/" + sNewMessageGuid).set({
					message: {
						email: newMessageEmail,
						text: sNewMessageText,
						timestamp: newMessageTimestamp
					}
				});
				this.getView().byId("newMessage").setValue("");
			}
		},

		_getUsers: function () {
			var that = this;
			var oRefToUserData = firebase.database().ref("/users");
			oRefToUserData.on("value", function (oSnapshot) {
				var mUserData = oSnapshot.toJSON();
				var aUserData = $.map(mUserData, function (oElement, sGuid) {
					oElement.guid = sGuid;
					return oElement;
				});
				var oUserModel = new sap.ui.model.json.JSONModel({});
				oUserModel.setProperty("/users", aUserData);
				oUserModel.setProperty("/currentUser", firebase.auth().currentUser.email);
				that.getView().setModel(oUserModel, "userModel");
			});
		},

		_createGUID: function () {
			return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
				var r = Math.random() * 16 | 0,
					v = c === "x" ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			});
		}
	});

});