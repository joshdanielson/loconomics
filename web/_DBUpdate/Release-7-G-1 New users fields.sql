/*
   lunes, 09 de marzo de 201521:35:20
   User: 
   Server: localhost\SQLEXPRESS
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
	DROP CONSTRAINT DF_users_GenderID
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT DF__users__IsProvide__3943762B
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT DF__users__IsCustome__3A379A64
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT DF_users_IsMember
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
CREATE TABLE dbo.Tmp_users
	(
	UserID int NOT NULL,
	FirstName varchar(50) NOT NULL,
	MiddleIn varchar(1) NOT NULL,
	LastName varchar(145) NOT NULL,
	SecondLastName varchar(145) NOT NULL,
	NickName varchar(50) NULL,
	PublicBio varchar(500) NULL,
	GenderID int NOT NULL,
	PreferredLanguageID int NULL,
	PreferredCountryID int NULL,
	IsProvider bit NULL,
	IsCustomer bit NULL,
	IsMember bit NOT NULL,
	IsAdmin bit NULL,
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
	MarketingSource varchar(2055) COLLATE Modern_Spanish_CI_AS NULL,
	BookCode varchar(64) NULL,
	OnboardingStep varchar(20) NULL,
	BirthMonthDay int NULL,
	BirthMonth int NULL,
	BusinessName nvarchar(145) NULL
	)  ON [PRIMARY]
GO
ALTER TABLE dbo.Tmp_users SET (LOCK_ESCALATION = TABLE)
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
	DF_users_IsMember DEFAULT ((0)) FOR IsMember
GO
ALTER TABLE dbo.Tmp_users ADD CONSTRAINT
	DF_users_CanReceiveSms DEFAULT 0 FOR CanReceiveSms
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
IF EXISTS(SELECT * FROM dbo.users)
	 EXEC('INSERT INTO dbo.Tmp_users (UserID, FirstName, MiddleIn, LastName, SecondLastName, NickName, PublicBio, GenderID, PreferredLanguageID, PreferredCountryID, IsProvider, IsCustomer, IsMember, IsAdmin, Photo, MobilePhone, AlternatePhone, ProviderProfileURL, ProviderWebsiteURL, SMSBookingCommunication, PhoneBookingCommunication, LoconomicsMarketingCampaigns, ProfileSEOPermission, CreatedDate, UpdatedDate, ModifiedBy, Active, LoconomicsCommunityCommunication, IAuthZumigoVerification, IAuthZumigoLocation, LoconomicsDBMCampaigns, AccountStatusID, CoBrandedPartnerPermissions, MarketingSource, BookCode, OnboardingStep, BirthMonthDay, BirthMonth)
		SELECT UserID, FirstName, MiddleIn, LastName, SecondLastName, NickName, PublicBio, GenderID, PreferredLanguageID, PreferredCountryID, IsProvider, IsCustomer, IsMember, IsAdmin, Photo, MobilePhone, AlternatePhone, ProviderProfileURL, ProviderWebsiteURL, SMSBookingCommunication, PhoneBookingCommunication, LoconomicsMarketingCampaigns, ProfileSEOPermission, CreatedDate, UpdatedDate, ModifiedBy, Active, LoconomicsCommunityCommunication, IAuthZumigoVerification, IAuthZumigoLocation, LoconomicsDBMCampaigns, AccountStatusID, CoBrandedPartnerPermissions, MarketingSource, BookCode, OnboardingStep, BirthMonthDay, BirthMonth FROM dbo.users WITH (HOLDLOCK TABLOCKX)')
GO
ALTER TABLE dbo.users
	DROP CONSTRAINT FK_users_users
GO
ALTER TABLE dbo.userprofilepositions
	DROP CONSTRAINT FK_userprofilepositions_users
GO
ALTER TABLE dbo.UserStats
	DROP CONSTRAINT FK_UserStats_users
GO
ALTER TABLE dbo.userbackgroundcheck
	DROP CONSTRAINT FK__userbackg__Provi__4BB72C21
GO
ALTER TABLE dbo.userlicenseverification
	DROP CONSTRAINT FK__licensece__Provi__17236851
GO
ALTER TABLE dbo.serviceaddress
	DROP CONSTRAINT FK__servicead__UserI__56F3D4A3
GO
ALTER TABLE dbo.bookingrequest
	DROP CONSTRAINT FK__bookingre__Provi__5C02A283
GO
ALTER TABLE dbo.bookingrequest
	DROP CONSTRAINT FK__bookingre__Custo__5B0E7E4A
GO
ALTER TABLE dbo.usereducation
	DROP CONSTRAINT FK__usereduca__UserI__2C1E8537
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
ALTER TABLE dbo.bookingrequest ADD CONSTRAINT
	FK__bookingre__Provi__5C02A283 FOREIGN KEY
	(
	ProviderUserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.bookingrequest ADD CONSTRAINT
	FK__bookingre__Custo__5B0E7E4A FOREIGN KEY
	(
	CustomerUserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.bookingrequest SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.bookingrequest', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.bookingrequest', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.bookingrequest', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
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
ALTER TABLE dbo.userlicenseverification ADD CONSTRAINT
	FK__licensece__Provi__17236851 FOREIGN KEY
	(
	ProviderUserID
	) REFERENCES dbo.users
	(
	UserID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.userlicenseverification SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.userlicenseverification', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.userlicenseverification', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.userlicenseverification', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
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
select Has_Perms_By_Name(N'dbo.userprofilepositions', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.userprofilepositions', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.userprofilepositions', 'Object', 'CONTROL') as Contr_Per 