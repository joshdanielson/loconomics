/*
   sábado, 17 de febrero de 20181:10:06
   User: 
   Server: ESTUDIO-I3\SQLEXPRESS
   Database: loconomics
   Application: 
*/

/* To prevent any potential data loss issues, you should review this script in detail before running it outside the context of the database designer.*/
BEGIN TRANSACTION
SET QUOTED_IDENTIFIER ON
SET ARITHABORT ON
SET NUMERIC_ROUNDABORT OFF
SET CONCAT_NULL_YIELDS_NULL ON
SET ANSI_NULLS ON
SET ANSI_PADDING ON
SET ANSI_WARNINGS ON
COMMIT
BEGIN TRANSACTION
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT FK_users_accountstatus
GO
ALTER TABLE dbo.accountstatus SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.accountstatus', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.accountstatus', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.accountstatus', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT FK_users_OwnerStatus
GO
ALTER TABLE dbo.OwnerStatus SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.OwnerStatus', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.OwnerStatus', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.OwnerStatus', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT DF_users_GenderID
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT DF__users__IsProvide__3943762B
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT DF__users__IsCustome__3A379A64
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT DF_users_IsAdmin
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT DF_users_IsContributor
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT DF__users__Collabora__5E7FE7D2
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT DF_users_CanReceiveSms
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT DF__users__SMSBookin__3B2BBE9D
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT DF__users__PhoneBook__3C1FE2D6
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT DF__users__Loconomic__3D14070F
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT DF__users__ProviderP__3E082B48
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT DF__users__Loconomic__3EFC4F81
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT DF__users__Loconomic__45FE52CB
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT DF__users__AccountSt__6265874F
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT DF__users__CoBranded__691284DE
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT DF__users__IsHipaaAd__70F39DC8
GO
CREATE TABLE dbo.Tmp_users
	(
	UserID int NOT NULL,
	FirstName varchar(50) NOT NULL,
	MiddleIn varchar(1) NOT NULL,
	LastName varchar(145) NOT NULL,
	SecondLastName varchar(145) NOT NULL,
	NickName varchar(50) NULL,
	PublicBio varchar(4000) NULL,
	GenderID int NOT NULL,
	PreferredLanguageID int NOT NULL,
	PreferredCountryID int NOT NULL,
	IsProvider bit NOT NULL,
	IsCustomer bit NOT NULL,
	IsAdmin bit NOT NULL,
	IsContributor bit NULL,
	IsCollaborator bit NOT NULL,
	Photo varchar(150) NULL,
	MobilePhone varchar(20) NULL,
	AlternatePhone varchar(20) NULL,
	CanReceiveSms bit NOT NULL,
	ProviderProfileURL varchar(2078) NULL,
	ProviderWebsiteURL varchar(2078) NULL,
	SMSBookingCommunication bit NOT NULL,
	PhoneBookingCommunication bit NOT NULL,
	LoconomicsMarketingCampaigns bit NOT NULL,
	ProfileSEOPermission bit NOT NULL,
	CreatedDate datetime NULL,
	UpdatedDate datetime NULL,
	ModifiedBy varchar(50) NULL,
	Active bit NULL,
	LoconomicsCommunityCommunication bit NOT NULL,
	IAuthZumigoVerification bit NULL,
	IAuthZumigoLocation bit NULL,
	LoconomicsDBMCampaigns bit NOT NULL,
	AccountStatusID int NOT NULL,
	CoBrandedPartnerPermissions bit NOT NULL,
	MarketingSource varchar(2055) NULL,
	BookCode varchar(64) NULL,
	OnboardingStep varchar(60) NULL,
	BirthMonthDay int NULL,
	BirthMonth int NULL,
	BusinessName nvarchar(145) NULL,
	AlternativeEmail nvarchar(56) NULL,
	ReferredByUserID int NULL,
	SignupDevice nvarchar(20) NULL,
	OwnerStatusID int NULL,
	OwnerAnniversaryDate datetime NULL,
	IsHipaaAdmin bit NOT NULL,
	TrialEndDate datetimeoffset(7) NULL
	)  ON [PRIMARY]
GO
ALTER TABLE dbo.Tmp_users SET (LOCK_ESCALATION = TABLE)
GO
DECLARE @v sql_variant 
SET @v = N'Is a contributor developer with access to some parts before only for admins like ''test'' pages'
EXECUTE sp_addextendedproperty N'MS_Description', @v, N'SCHEMA', N'dbo', N'TABLE', N'Tmp_users', N'COLUMN', N'IsContributor'
GO
DECLARE @v sql_variant 
SET @v = N'Optional field for customer users created by freelancers when adding them to their clients list. The referredByUserID is a freelancer that created, and can edit, the record (until the customer enables its marketplace account, this field value is preserved but status change)'
EXECUTE sp_addextendedproperty N'MS_Description', @v, N'SCHEMA', N'dbo', N'TABLE', N'Tmp_users', N'COLUMN', N'ReferredByUserID'
GO
DECLARE @v sql_variant 
SET @v = N'Choosen device from list on the signup form'
EXECUTE sp_addextendedproperty N'MS_Description', @v, N'SCHEMA', N'dbo', N'TABLE', N'Tmp_users', N'COLUMN', N'SignupDevice'
GO
ALTER TABLE dbo.Tmp_users ADD CONSTRAINT
	DF_users_GenderID DEFAULT ((-1)) FOR GenderID
GO
ALTER TABLE dbo.Tmp_users ADD CONSTRAINT
	DF__users__IsProvide__3943762B DEFAULT ((0)) FOR IsProvider
GO
ALTER TABLE dbo.Tmp_users ADD CONSTRAINT
	DF__users__IsCustome__3A379A64 DEFAULT ((0)) FOR IsCustomer
GO
ALTER TABLE dbo.Tmp_users ADD CONSTRAINT
	DF_users_IsAdmin DEFAULT ((0)) FOR IsAdmin
GO
ALTER TABLE dbo.Tmp_users ADD CONSTRAINT
	DF_users_IsContributor DEFAULT ((0)) FOR IsContributor
GO
ALTER TABLE dbo.Tmp_users ADD CONSTRAINT
	DF__users__Collabora__5E7FE7D2 DEFAULT ((0)) FOR IsCollaborator
GO
ALTER TABLE dbo.Tmp_users ADD CONSTRAINT
	DF_users_CanReceiveSms DEFAULT ((0)) FOR CanReceiveSms
GO
ALTER TABLE dbo.Tmp_users ADD CONSTRAINT
	DF__users__SMSBookin__3B2BBE9D DEFAULT ((1)) FOR SMSBookingCommunication
GO
ALTER TABLE dbo.Tmp_users ADD CONSTRAINT
	DF__users__PhoneBook__3C1FE2D6 DEFAULT ((1)) FOR PhoneBookingCommunication
GO
ALTER TABLE dbo.Tmp_users ADD CONSTRAINT
	DF__users__Loconomic__3D14070F DEFAULT ((1)) FOR LoconomicsMarketingCampaigns
GO
ALTER TABLE dbo.Tmp_users ADD CONSTRAINT
	DF__users__ProviderP__3E082B48 DEFAULT ((1)) FOR ProfileSEOPermission
GO
ALTER TABLE dbo.Tmp_users ADD CONSTRAINT
	DF__users__Loconomic__3EFC4F81 DEFAULT ((1)) FOR LoconomicsCommunityCommunication
GO
ALTER TABLE dbo.Tmp_users ADD CONSTRAINT
	DF__users__Loconomic__45FE52CB DEFAULT ((1)) FOR LoconomicsDBMCampaigns
GO
ALTER TABLE dbo.Tmp_users ADD CONSTRAINT
	DF__users__AccountSt__6265874F DEFAULT ((1)) FOR AccountStatusID
GO
ALTER TABLE dbo.Tmp_users ADD CONSTRAINT
	DF__users__CoBranded__691284DE DEFAULT ((1)) FOR CoBrandedPartnerPermissions
GO
ALTER TABLE dbo.Tmp_users ADD CONSTRAINT
	DF__users__IsHipaaAd__70F39DC8 DEFAULT ((0)) FOR IsHipaaAdmin
GO
IF EXISTS(SELECT * FROM dbo.users)
	 EXEC('INSERT INTO dbo.Tmp_users (UserID, FirstName, MiddleIn, LastName, SecondLastName, NickName, PublicBio, GenderID, PreferredLanguageID, PreferredCountryID, IsProvider, IsCustomer, IsAdmin, IsContributor, IsCollaborator, Photo, MobilePhone, AlternatePhone, CanReceiveSms, ProviderProfileURL, ProviderWebsiteURL, SMSBookingCommunication, PhoneBookingCommunication, LoconomicsMarketingCampaigns, ProfileSEOPermission, CreatedDate, UpdatedDate, ModifiedBy, Active, LoconomicsCommunityCommunication, IAuthZumigoVerification, IAuthZumigoLocation, LoconomicsDBMCampaigns, AccountStatusID, CoBrandedPartnerPermissions, MarketingSource, BookCode, OnboardingStep, BirthMonthDay, BirthMonth, BusinessName, AlternativeEmail, ReferredByUserID, SignupDevice, OwnerStatusID, OwnerAnniversaryDate, IsHipaaAdmin, TrialEndDate)
		SELECT UserID, FirstName, MiddleIn, LastName, SecondLastName, NickName, PublicBio, GenderID, PreferredLanguageID, PreferredCountryID, IsProvider, IsCustomer, IsAdmin, IsContributor, IsCollaborator, Photo, MobilePhone, AlternatePhone, CanReceiveSms, ProviderProfileURL, ProviderWebsiteURL, SMSBookingCommunication, PhoneBookingCommunication, LoconomicsMarketingCampaigns, ProfileSEOPermission, CreatedDate, UpdatedDate, ModifiedBy, Active, LoconomicsCommunityCommunication, IAuthZumigoVerification, IAuthZumigoLocation, LoconomicsDBMCampaigns, AccountStatusID, CoBrandedPartnerPermissions, MarketingSource, BookCode, OnboardingStep, BirthMonthDay, BirthMonth, BusinessName, AlternativeEmail, ReferredByUserID, SignupDevice, OwnerStatusID, OwnerAnniversaryDate, IsHipaaAdmin, TrialEndDate FROM dbo.users WITH (HOLDLOCK TABLOCKX)')
GO
ALTER TABLE dbo.UserExternalListing
	DROP CONSTRAINT FK_UserExternalListing_users
GO
ALTER TABLE dbo.UserEarningsEntry
	DROP CONSTRAINT FK_UserEarningsEntry_users
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT FK_users_users1
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT FK_users_users
GO
ALTER TABLE dbo.serviceaddress
	DROP CONSTRAINT FK__servicead__UserI__56F3D4A3
GO
ALTER TABLE dbo.userbackgroundcheck
	DROP CONSTRAINT FK__userbackg__Provi__4BB72C21
GO
ALTER TABLE dbo.UserStats
	DROP CONSTRAINT FK_UserStats_users
GO
ALTER TABLE dbo.userprofilepositions
	DROP CONSTRAINT FK_userprofilepositions_users
GO
ALTER TABLE dbo.UserLicenseCertifications
	DROP CONSTRAINT FK__userlicen__Provi__5B045CA9
GO
ALTER TABLE dbo.MessagingThreads
	DROP CONSTRAINT FK_MessagingThreads_users
GO
ALTER TABLE dbo.booking
	DROP CONSTRAINT FK__booking__AwaitingResponseFromUserID
GO
ALTER TABLE dbo.booking
	DROP CONSTRAINT FK__booking__client
GO
ALTER TABLE dbo.booking
	DROP CONSTRAINT FK__booking__serviceProfessional
GO
ALTER TABLE dbo.CalendarProviderAttributes
	DROP CONSTRAINT FK_CalendarProviderAttributes_users
GO
ALTER TABLE dbo.ServiceProfessionalClient
	DROP CONSTRAINT FK_ProviderCustomer_users
GO
ALTER TABLE dbo.ServiceProfessionalClient
	DROP CONSTRAINT FK_ProviderCustomer_users1
GO
ALTER TABLE dbo.usereducation
	DROP CONSTRAINT FK__usereduca__UserI__2C1E8537
GO
ALTER TABLE dbo.OwnerAcknowledgment
	DROP CONSTRAINT FK_OwnerAcknowledgment_users
GO
ALTER TABLE dbo.CCCUsers
	DROP CONSTRAINT FK__CCCUsers__UserID__6EA14102
GO
ALTER TABLE dbo.UserEarnings
	DROP CONSTRAINT FK_UserEarnings_users
GO
ALTER TABLE dbo.UserEarnings
	DROP CONSTRAINT FK_UserEarnings_users1
GO
DROP TABLE dbo.users
GO
EXECUTE sp_rename N'dbo.Tmp_users', N'users', 'OBJECT' 
GO
ALTER TABLE dbo.users ADD CONSTRAINT
	PK_users PRIMARY KEY CLUSTERED 
	(
	UserID
	) WITH( PAD_INDEX = OFF, FILLFACTOR = 100, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
ALTER TABLE dbo.users ADD CONSTRAINT
	FK_users_users1 FOREIGN KEY
	(
	UserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.users ADD CONSTRAINT
	FK_users_OwnerStatus FOREIGN KEY
	(
	OwnerStatusID
	) REFERENCES dbo.OwnerStatus
	(
	OwnserStatusID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.users ADD CONSTRAINT
	FK_users_accountstatus FOREIGN KEY
	(
	AccountStatusID
	) REFERENCES dbo.accountstatus
	(
	AccountStatusID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.users ADD CONSTRAINT
	FK_users_users FOREIGN KEY
	(
	UserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Execute all user tests on insert
--  to active all the alerts
-- =============================================
CREATE TRIGGER trigInitialUserAlertTest
   ON  dbo.users
   AFTER INSERT
AS 
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	
	DECLARE @UserID int
	
	SELECT @UserID = UserID FROM INSERTED

    EXEC TestAllUserAlerts @UserID

END
GO
COMMIT
select Has_Perms_By_Name(N'dbo.users', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.users', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.users', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.UserEarnings ADD CONSTRAINT
	FK_UserEarnings_users FOREIGN KEY
	(
	UserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.UserEarnings ADD CONSTRAINT
	FK_UserEarnings_users1 FOREIGN KEY
	(
	ClientID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.UserEarnings SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.UserEarnings', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.UserEarnings', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.UserEarnings', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.CCCUsers ADD CONSTRAINT
	FK__CCCUsers__UserID__6EA14102 FOREIGN KEY
	(
	UserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.CCCUsers SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CCCUsers', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CCCUsers', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CCCUsers', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.OwnerAcknowledgment ADD CONSTRAINT
	FK_OwnerAcknowledgment_users FOREIGN KEY
	(
	UserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.OwnerAcknowledgment SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.OwnerAcknowledgment', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.OwnerAcknowledgment', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.OwnerAcknowledgment', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.usereducation ADD CONSTRAINT
	FK__usereduca__UserI__2C1E8537 FOREIGN KEY
	(
	UserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.usereducation SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.usereducation', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.usereducation', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.usereducation', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.ServiceProfessionalClient ADD CONSTRAINT
	FK_ProviderCustomer_users FOREIGN KEY
	(
	ServiceProfessionalUserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.ServiceProfessionalClient ADD CONSTRAINT
	FK_ProviderCustomer_users1 FOREIGN KEY
	(
	ClientUserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.ServiceProfessionalClient SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.ServiceProfessionalClient', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.ServiceProfessionalClient', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.ServiceProfessionalClient', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.CalendarProviderAttributes ADD CONSTRAINT
	FK_CalendarProviderAttributes_users FOREIGN KEY
	(
	UserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  CASCADE 
	 ON DELETE  CASCADE 
	
GO
ALTER TABLE dbo.CalendarProviderAttributes SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarProviderAttributes', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarProviderAttributes', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarProviderAttributes', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.booking ADD CONSTRAINT
	FK__booking__AwaitingResponseFromUserID FOREIGN KEY
	(
	AwaitingResponseFromUserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.booking ADD CONSTRAINT
	FK__booking__client FOREIGN KEY
	(
	ClientUserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.booking ADD CONSTRAINT
	FK__booking__serviceProfessional FOREIGN KEY
	(
	ServiceProfessionalUserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.booking SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.booking', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.booking', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.booking', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.MessagingThreads ADD CONSTRAINT
	FK_MessagingThreads_users FOREIGN KEY
	(
	ProviderUserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.MessagingThreads SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.MessagingThreads', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.MessagingThreads', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.MessagingThreads', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.UserLicenseCertifications ADD CONSTRAINT
	FK__userlicen__Provi__5B045CA9 FOREIGN KEY
	(
	ProviderUserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.UserLicenseCertifications SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.UserLicenseCertifications', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.UserLicenseCertifications', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.UserLicenseCertifications', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.userprofilepositions ADD CONSTRAINT
	FK_userprofilepositions_users FOREIGN KEY
	(
	UserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.userprofilepositions SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.userprofilepositions', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.userprofilepositions', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.userprofilepositions', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.UserStats ADD CONSTRAINT
	FK_UserStats_users FOREIGN KEY
	(
	UserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.UserStats SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.UserStats', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.UserStats', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.UserStats', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.userbackgroundcheck ADD CONSTRAINT
	FK__userbackg__Provi__4BB72C21 FOREIGN KEY
	(
	UserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.userbackgroundcheck SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.userbackgroundcheck', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.userbackgroundcheck', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.userbackgroundcheck', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.serviceaddress ADD CONSTRAINT
	FK__servicead__UserI__56F3D4A3 FOREIGN KEY
	(
	UserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.serviceaddress SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.serviceaddress', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.serviceaddress', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.serviceaddress', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.UserEarningsEntry ADD CONSTRAINT
	FK_UserEarningsEntry_users FOREIGN KEY
	(
	UserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.UserEarningsEntry SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.UserEarningsEntry', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.UserEarningsEntry', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.UserEarningsEntry', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.UserExternalListing ADD CONSTRAINT
	FK_UserExternalListing_users FOREIGN KEY
	(
	UserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.UserExternalListing SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.UserExternalListing', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.UserExternalListing', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.UserExternalListing', 'Object', 'CONTROL') as Contr_Per 