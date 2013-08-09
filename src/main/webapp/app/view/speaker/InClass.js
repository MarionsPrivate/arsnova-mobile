/*--------------------------------------------------------------------------+
 This file is part of ARSnova.
 app/speaker/inClass.js
 - Beschreibung: Startseite für Session-Inhaber.
 - Version:      1.0, 01/05/12
 - Autor(en):    Christian Thomas Weber <christian.t.weber@gmail.com>
 +---------------------------------------------------------------------------+
 This program is free software; you can redistribute it and/or
 modify it under the terms of the GNU General Public License
 as published by the Free Software Foundation; either version 2
 of the License, or any later version.
 +---------------------------------------------------------------------------+
 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
 You should have received a copy of the GNU General Public License
 along with this program; if not, write to the Free Software
 Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
 +--------------------------------------------------------------------------*/
Ext.define('ARSnova.view.speaker.InClass', {
	extend: 'Ext.Panel',
	
	config: {
		fullscreen: true,
		title	: Messages.FEEDBACK,
		iconCls	: 'feedbackMedium',
		scrollable: true,
		scroll  : 'vertical'
	},
	
	inClassItems			: null,
	
	inClassActions: null,
	sessionStatusButton			: null,
	createAdHocQuestionButton	: null,
	
	/**
	 * count every x seconds all actually logged-in users for this sessions
	 */
	countActiveUsersTask: {
		name: 'count the actually logged in users',
		run: function(){
			ARSnova.app.mainTabPanel.tabPanel.speakerTabPanel.inClassPanel.countActiveUsers();
		},
		interval: 15000
	},
	
	/**
	 * task for speakers in a session
	 * count every x seconds the number of feedback questions
	 */
	countFeedbackQuestionsTask: {
		name: 'count feedback questions',
		run: function(){
			ARSnova.app.mainTabPanel.tabPanel.speakerTabPanel.inClassPanel.countFeedbackQuestions();
		},
		interval: 15000
	},
	
	initialize: function(){
		this.callParent(arguments);
		
		var comingSoon = function(component) {
			var comingSoonPanel = Ext.create('Ext.Panel', {
				html: "<div style='padding: 0.5em'>"+Messages.FEATURE_COMING_SOON+"</div>"
			});
			comingSoonPanel.showBy(component, 'tc-bc');
			Ext.defer(function() {
				comingSoonPanel.destroy();
			}, 2000);
		};
		
		var loggedInCls = '';
		if (ARSnova.app.loginMode == ARSnova.app.LOGIN_THM) {
			loggedInCls = 'thm';
		}
		
		this.sessionLogoutButton = Ext.create('Ext.Button', {
			text	: Messages.SESSIONS,
			ui		: 'back',
			cls		: loggedInCls,
			handler	: function() {
				ARSnova.app.getController('Sessions').logout();
			}
		});
		
		this.toolbar = Ext.create('Ext.Toolbar', {
			title: localStorage.getItem("shortName"),
			ui: 'light',
			docked: 'top',
			items: [
		        this.sessionLogoutButton
			]
		});
		
		this.feedbackButton = Ext.create('ARSnova.view.MultiBadgeButton', {
			text		: Messages.LIVE_FEEDBACK,
			cls			: 'forwardListButton',
			badgeCls	: 'badgeicon feedbackARSnova',
			handler		: comingSoon
		});
		
		this.preparationQuestionButton = Ext.create('ARSnova.view.MultiBadgeButton', {
			text		: Messages.PREPARATION_QUESTIONS,
			cls			: 'forwardListButton',
			controller	: 'Questions',
			action		: 'listAudienceQuestions',
			handler		: this.buttonClicked
		});
		
		this.lectureQuestionButton = Ext.create('ARSnova.view.MultiBadgeButton', {
			text		: Messages.LECTURE_QUESTIONS,
			cls			: 'forwardListButton',
			handler		: comingSoon
		});
		
		this.feedbackQuestionButton = Ext.create('ARSnova.view.MultiBadgeButton', {
			ui			: 'normal',
			text		: Messages.QUESTIONS_FROM_STUDENTS,
			cls			: 'forwardListButton',
			controller	: 'Questions',
			action		: 'listFeedbackQuestions',
			handler		: this.buttonClicked
		});
		
		this.flashcardsButton = Ext.create('ARSnova.view.MultiBadgeButton', {
			text		: Messages.FLASHCARDS,
			cls			: 'forwardListButton',
			handler		: comingSoon
		});
		
		this.courseLearningProgress = Ext.create('ARSnova.view.MultiBadgeButton', {
			text		: Messages.COURSES_LEARNING_PROGRESS,
			cls			: 'forwardListButton',
			handler		: comingSoon
		});
		
		this.inClassItems = Ext.create('Ext.form.FormPanel', {
			scrollable: null,
			
			items: [{
				cls: 'gravure',
				style: 'padding:15px 0 0',
				html: Messages.SESSION_ID + ": " + ARSnova.app.formatSessionID(localStorage.getItem("keyword"))
			}, {
				xtype: 'formpanel',
				cls	 : 'standardForm topPadding',
				scrollable: null,
				
				items: [
					this.feedbackButton,
					this.feedbackQuestionButton,
					this.preparationQuestionButton,
					this.lectureQuestionButton,
					this.flashcardsButton,
					this.courseLearningProgress
				]
			}]
		});
		
		this.sessionStatusButton = Ext.create('ARSnova.view.SessionStatusButton');
		
		this.createAdHocQuestionButton = Ext.create('ARSnova.view.MatrixButton', {
			text		: Messages.AH_HOC_QUESTION,
			image		: 'question',
			controller	: 'Questions',
			action		: 'adHoc',
			handler		: this.buttonClicked
		});
		
		this.deleteSessionButton = Ext.create('ARSnova.view.MatrixButton', {
			text: Messages.DELETE_SESSION,
			image: 'delete_session',
			scope	: this,
			handler	: function(){
				var msg = Messages.ARE_YOU_SURE +
						"<br>" + Messages.DELETE_SESSION_NOTICE;
				Ext.Msg.confirm(Messages.DELETE_SESSION, msg, function(answer){
					if (answer == 'yes') {
						ARSnova.app.showLoadMask(Messages.LOAD_MASK_SESSION_DELETE);
						ARSnova.app.sessionModel.destroy(localStorage.getItem('keyword'), {
							success: function(){
								ARSnova.app.removeVisitedSession(localStorage.getItem('sessionId'));
								ARSnova.app.mainTabPanel.tabPanel.on('activeitemchange', function(){
									ARSnova.app.mainTabPanel.tabPanel.homeTabPanel.mySessionsPanel.loadCreatedSessions();
								}, this, {single:true});
								ARSnova.app.getController('Sessions').logout();
							},
							failure: function(response){
								console.log('server-side error delete session');
							}
						});
					}
				});
			}
		});
		
		this.inClassActions = Ext.create('Ext.Panel', {
			style	: { marginTop: '50px' },
			layout  : {
				type: 'hbox',
				pack: 'center'
			},
				
			items: [
			    this.createAdHocQuestionButton,
			    this.sessionStatusButton,
			    this.deleteSessionButton
	        ]
				        
		});
		
		this.add([this.toolbar, this.inClassItems, this.inClassActions]);
		
		this.on('destroy', this.destroyListeners);
		
		this.onBefore('painted', function(){
			this.updateBadges();
		});
	},
	
	buttonClicked: function(button){
		ARSnova.app.getController(button.config.controller)[button.config.action]();
	},
	
	/* will be called on session login */
	registerListeners: function(){
		var inClassPanel = ARSnova.app.mainTabPanel.tabPanel.speakerTabPanel.inClassPanel;
		taskManager.start(inClassPanel.countActiveUsersTask);
		taskManager.start(inClassPanel.countFeedbackQuestionsTask);
	},

	/* will be called on session logout */
	destroyListeners: function(){
		var inClassPanel = ARSnova.app.mainTabPanel.tabPanel.speakerTabPanel.inClassPanel;
		taskManager.stop(inClassPanel.countActiveUsersTask);
		taskManager.stop(inClassPanel.countFeedbackQuestionsTask);
	},
	
	updateBadges: function(){
		var panel = ARSnova.app.mainTabPanel.tabPanel.speakerTabPanel.inClassPanel;
		panel.updateAudienceQuestionBadge();
	},
	
	updateAudienceQuestionBadge: function() {
		var failureCallback = function() {
			console.log('server-side error');
		};
		
		ARSnova.app.questionModel.countSkillQuestions(localStorage.getItem("keyword"), {
			success: function(response) {
				var numQuestions = parseInt(response.responseText);
				ARSnova.app.questionModel.countTotalAnswers(localStorage.getItem("keyword"), {
					success: function(response) {
						var numAnswers = parseInt(response.responseText);
						
						var panel = ARSnova.app.mainTabPanel.tabPanel.speakerTabPanel.inClassPanel;
						var audienceQuestionButton = panel.preparationQuestionButton;
						
						audienceQuestionButton.setBadge([
											{badgeText: numQuestions, badgeCls: "greybadgeicon"},
											{badgeText: numAnswers, badgeCls: "redbadgeicon"}
										]);
					},
					failure: failureCallback
				});
			}, 
			failure: failureCallback
		});
	},
	
	countActiveUsers: function(){
		ARSnova.app.loggedInModel.countActiveUsersBySession(localStorage.getItem("keyword"), {
			success: function(response){
				var value = parseInt(response.responseText);
				if (value > 0) {
					// Do not count myself ;-)
					value--;
				}
			},
			failure: function(){
				console.log('server-side error');
			}
		});
	},
	
	countFeedbackQuestions: function(){
		ARSnova.app.questionModel.countFeedbackQuestions(localStorage.getItem("keyword"), {
			success: function(response){
				var questionCount = Ext.decode(response.responseText);
				ARSnova.app.mainTabPanel.tabPanel.feedbackQuestionsPanel.tab.setBadgeText(questionCount.unread);
				
				var feedbackQButton = ARSnova.app.mainTabPanel.tabPanel.speakerTabPanel.inClassPanel.feedbackQuestionButton;
				feedbackQButton.setBadge([{badgeText: questionCount.total, badgeCls: "bluebadgeicon"}]);
			}, 
			failure: function(){
				console.log('server-side error');
			}
		});
	}
});
