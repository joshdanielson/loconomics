CREATE TABLE dbo.SearchSubCategory
(SearchSubCategoryID int NOT NULL,
LanguageID int NOT NULL,
CountryID int NOT NULL,
SearchCategoryID int NOT NULL,
Name nvarchar(40) NOT NULL,
ShortDescription nvarchar(100),
LongDescription nvarchar(300),
SmallImage nvarchar(255),
BannerImage nvarchar(255),
DisplayRank int,
CreatedDate datetimeoffset NOT NULL,
UpdatedDate datetimeoffset NOT NULL,
ModifiedBy nvarchar(4) DEFAULT 'sys' NOT NULL,
Active bit DEFAULT 1 NOT NULL,
PRIMARY KEY (SearchSubCategoryID,LanguageID, CountryID));