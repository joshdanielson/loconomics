/*
   viernes, 09 de marzo de 201814:07:48
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
ALTER TABLE dbo.Specialization
	DROP CONSTRAINT FK_Specialization_Solution
GO
ALTER TABLE dbo.Solution SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.Solution', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.Solution', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.Solution', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.Specialization
	DROP CONSTRAINT DF__Specializ__Creat__23D42350
GO
ALTER TABLE dbo.Specialization
	DROP CONSTRAINT DF__Specializ__Appro__24C84789
GO
ALTER TABLE dbo.Specialization
	DROP CONSTRAINT DF__Specializ__Activ__25BC6BC2
GO
CREATE TABLE dbo.Tmp_Specialization
	(
	SpecializationID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	SolutionID int NOT NULL,
	Name nvarchar(100) NOT NULL,
	DisplayRank int NULL,
	CreatedDate datetimeoffset(7) NOT NULL,
	UpdatedDate datetimeoffset(7) NOT NULL,
	CreatedBy nvarchar(12) NOT NULL,
	Approved bit NOT NULL,
	Active bit NOT NULL
	)  ON [PRIMARY]
GO
ALTER TABLE dbo.Tmp_Specialization SET (LOCK_ESCALATION = TABLE)
GO
ALTER TABLE dbo.Tmp_Specialization ADD CONSTRAINT
	DF__Specializ__Creat__23D42350 DEFAULT ('staff') FOR CreatedBy
GO
ALTER TABLE dbo.Tmp_Specialization ADD CONSTRAINT
	DF__Specializ__Appro__24C84789 DEFAULT ((0)) FOR Approved
GO
ALTER TABLE dbo.Tmp_Specialization ADD CONSTRAINT
	DF__Specializ__Activ__25BC6BC2 DEFAULT ((1)) FOR Active
GO
IF EXISTS(SELECT * FROM dbo.Specialization)
	 EXEC('INSERT INTO dbo.Tmp_Specialization (SpecializationID, LanguageID, CountryID, SolutionID, Name, DisplayRank, CreatedDate, UpdatedDate, CreatedBy, Approved, Active)
		SELECT SpecializationID, LanguageID, CountryID, SolutionID, Name, DisplayRank, CreatedDate, UpdatedDate, CreatedBy, Approved, Active FROM dbo.Specialization WITH (HOLDLOCK TABLOCKX)')
GO
DROP TABLE dbo.Specialization
GO
EXECUTE sp_rename N'dbo.Tmp_Specialization', N'Specialization', 'OBJECT' 
GO
ALTER TABLE dbo.Specialization ADD CONSTRAINT
	PK_Specialization PRIMARY KEY CLUSTERED 
	(
	SpecializationID,
	LanguageID,
	CountryID
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
ALTER TABLE dbo.Specialization ADD CONSTRAINT
	FK_Specialization_Solution FOREIGN KEY
	(
	SolutionID,
	LanguageID,
	CountryID
	) REFERENCES dbo.Solution
	(
	SolutionID,
	LanguageID,
	CountryID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
COMMIT
select Has_Perms_By_Name(N'dbo.Specialization', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.Specialization', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.Specialization', 'Object', 'CONTROL') as Contr_Per 