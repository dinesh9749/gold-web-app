
-- Update MS Gold soldering jobs with completely isolated sequence starting from INV-1001 (rajameera gold)
UPDATE soldering_engraving_jobs AS s
SET 
  invoice_number = v.inv_no,
  invoice_no = v.inv_no
FROM (VALUES
('a6ffbfb4-185f-47c4-bc78-11d0854e933a'::uuid, 'INV-1001'),
('97680d0f-b69c-408c-ab0e-47ab39320adc'::uuid, 'INV-1002'),
('56643bee-f45f-4fce-aaad-d8486b176be8'::uuid, 'INV-1003'),
('92599752-3e3d-4380-b5cc-44a02c739206'::uuid, 'INV-1004'),
('33295b3a-da87-4cdc-9962-6e0f42a30d8a'::uuid, 'INV-1005'),
('67e7c93e-f095-4a69-be0d-626898e3379e'::uuid, 'INV-1006'),
('5358b214-49c4-4f13-a377-fdcde8de6f55'::uuid, 'INV-1007'),
('2fd1036b-5bba-4e2f-8e36-54ce4d7579e2'::uuid, 'INV-1008'),
('edda77e4-619b-4428-a840-c31c3bd9f8b5'::uuid, 'INV-1009'),
('fa91e6a6-7a00-4800-ac78-1a884ae6657d'::uuid, 'INV-1010'),
('248dffe8-9c41-4ae1-88f0-d3dbf1dbf21c'::uuid, 'INV-1011'),
('477af4f3-8ac2-41b4-adef-c59fd81d624a'::uuid, 'INV-1012'),
('80bc3112-3965-4e9a-9dd1-9b8ab5904862'::uuid, 'INV-1013'),
('dc5c452b-3eef-4a9f-b40e-38f0e291a841'::uuid, 'INV-1014'),
('1fdc942c-fb5d-4ae1-9889-f1b36df88f89'::uuid, 'INV-1015'),
('f3bbebac-b230-418c-b52b-de1030bfacbc'::uuid, 'INV-1016'),
('2c0d8eca-9d1a-4fcc-ab2b-ffd81e721d50'::uuid, 'INV-1017'),
('6e28f587-8c24-4df8-9746-75e04e060572'::uuid, 'INV-1018'),
('af9b9b57-9427-4906-beaa-8183c71f0452'::uuid, 'INV-1019'),
('9ab8c816-8182-432c-98e6-838a5a35d9a6'::uuid, 'INV-1020'),
('f7c435ef-05c3-4e7e-bf88-b87fc97834bc'::uuid, 'INV-1021'),
('ac8b9d3a-eb4b-49ce-b5c7-fa6f26650f9a'::uuid, 'INV-1022'),
('32d8a410-3dad-4e68-8ae6-a796060d30f4'::uuid, 'INV-1025'),
('cabdfaab-4568-4e2d-9cae-f6cf171207ee'::uuid, 'INV-1026'),
('d0472921-761d-4313-b2c6-eee5eb3a9815'::uuid, 'INV-1027'),
('493139e4-61b4-4d61-b644-0fcff498c9bc'::uuid, 'INV-1028'),
('62cca46a-5134-4a4c-8245-fa28a1d9d9ba'::uuid, 'INV-1029'),
('1faebf8a-7e2f-483f-a2a3-d2c8d355760d'::uuid, 'INV-1030'),
('67870ef3-2f01-482a-8a3a-faaef14f4fd3'::uuid, 'INV-1031'),
('3cbe0c38-a808-4b94-a231-4b66c7f6925c'::uuid, 'INV-1032'),
('94453011-eeeb-41dd-9686-5c928b6fc69f'::uuid, 'INV-1033'),
('a92fec6f-4a0f-4fea-af8c-ec386df11a50'::uuid, 'INV-1034'),
('90aec69b-42bc-4b6f-af32-235018bc1e57'::uuid, 'INV-1035'),
('d80747db-77e5-4802-88b5-7a23a033df8c'::uuid, 'INV-1036'),
('072d1f10-9a38-4d27-a090-405a5417753b'::uuid, 'INV-1037'),
('729ac03e-252f-4991-9f30-4ea4291c03d0'::uuid, 'INV-1038'),
('a6857f58-02dd-45d6-bbb0-486f17e8b381'::uuid, 'INV-1039'),
('7fce81e3-3e91-4255-8b81-ff6572c18055'::uuid, 'INV-1040'),
('dfa7df6d-dc96-4c04-bbe1-191cb71a6beb'::uuid, 'INV-1041'),
('40523832-6e33-4c3e-b3ff-a2ad961f3953'::uuid, 'INV-1042'),
('eca4238b-8d56-4c7b-831e-32d579ebd0a4'::uuid, 'INV-1043'),
('cd0a89c1-2ad7-4bfd-a84f-7d2d8ff94741'::uuid, 'INV-1044'),
('9825f312-e962-4a07-a834-23fa44d9c83c'::uuid, 'INV-1045'),
('81c4ba6c-a183-4bf3-a34d-9d8a5f91d27f'::uuid, 'INV-1046'),
('bc42a27a-8a47-4a69-ba53-8dadd26e9689'::uuid, 'INV-1047'),
('2c9bc893-254a-4f47-8d55-6735750f4e3a'::uuid, 'INV-1048'),
('5214651f-02d1-48f8-8914-f41715e59839'::uuid, 'INV-1049'),
('c58f5bc9-25da-46a3-9a3c-59a01c22055f'::uuid, 'INV-1050'),
('7af2d0bc-a383-46ee-812b-795f8e9e3ae9'::uuid, 'INV-1051'),
('f73aab58-7acb-4205-817c-3e372c434f4a'::uuid, 'INV-1052'),
('24ffd745-69ff-4e85-8329-b82803745417'::uuid, 'INV-1053'),
('d714a080-795f-4379-87cd-5742ce757e0c'::uuid, 'INV-1054'),
('ada77890-565b-47cf-acf2-ea8a7d8e9b54'::uuid, 'INV-1055'),
('b74c9588-826b-452b-9728-c7883b74366c'::uuid, 'INV-1056'),
('f2babd99-e3c5-4d88-a13b-ea5bf0ccc487'::uuid, 'INV-1057'),
('97ad4789-85c9-40cd-a0f2-dec88257011c'::uuid, 'INV-1058'),
('fdf26b70-30d6-419f-b14c-8b4ef936ebb4'::uuid, 'INV-1059'),
('d625af30-1efb-432c-a8a4-0b9437b2dbbc'::uuid, 'INV-1060'),
('aa4baed7-c1e7-4966-be8a-e0b2cfda072e'::uuid, 'INV-1061'),
('c828a886-5889-471f-8662-8551154a1f0d'::uuid, 'INV-1062'),
('80c480f6-73cc-45bb-ba26-72c8b52760dd'::uuid, 'INV-1063'),
('a907d731-4e93-4c05-bbea-a027daff56b4'::uuid, 'INV-1064'),
('c36c9021-354e-4e12-b6a6-70eb67faa64d'::uuid, 'INV-1065'),
('3ff4a5fa-af24-48cc-8bdd-247034574439'::uuid, 'INV-1066'),
('d7a99c64-482d-4dae-b521-7c1d910d171a'::uuid, 'INV-1067'),
('b0003841-f22a-4be9-aece-327f12f9ec5f'::uuid, 'INV-1068'),
('aded8f50-865e-4145-8b23-3b63462bd6bb'::uuid, 'INV-1069'),
('0067c660-cab3-4224-8fb3-a47983e167f4'::uuid, 'INV-1070'),
('1f4045d0-eb42-420d-9de7-26f89f5f7793'::uuid, 'INV-1071'),
('92779eb7-2008-4c67-b80e-1702144f32e8'::uuid, 'INV-1072'),
('3943fe16-02ac-4817-aaa8-512055a7bb22'::uuid, 'INV-1073'),
('93810e43-614e-47a0-9fa2-2a4a8c82e55b'::uuid, 'INV-1074'),
('90f7f435-a945-479d-89ca-c232f8927a7b'::uuid, 'INV-1075'),
('f1800517-291c-46ad-8fdc-29dc9677eeae'::uuid, 'INV-1076'),
('c4fafba5-a562-4bdc-b090-61d4754660b6'::uuid, 'INV-1077'),
('1a55b642-ed34-470d-a4c7-3cfd6059c355'::uuid, 'INV-1078'),
('b8293d28-9f70-4ccc-956b-ef297df6cf56'::uuid, 'INV-1079'),
('a9549631-dbf7-4624-8f17-e3a583e9e413'::uuid, 'INV-1080'),
('2894d112-3ba7-45f1-a4aa-d7ce415b0fe0'::uuid, 'INV-1081'),
('1251ee42-e004-438d-a474-5eb7c51367de'::uuid, 'INV-1082'),
('9f724470-4c9a-40d5-a6c4-239e23e3116c'::uuid, 'INV-1083'),
('0ab6a71e-77a4-4e1c-9ea7-82fe4a12e0bd'::uuid, 'INV-1084'),
('61dd00d1-e808-4a8f-84bb-6ceefdccb93a'::uuid, 'INV-1085'),
('63e0f5ce-a415-4418-b47d-4e9a3ac16c83'::uuid, 'INV-1086'),
('19d6a69d-dd0b-40ca-bdc9-8e8c459ce1b6'::uuid, 'INV-1087'),
('b13f4a08-0ab0-4cb2-9688-de1fe6f0dd5f'::uuid, 'INV-1088'),
('689f12d7-1fd6-4afa-8746-fe238dd6756f'::uuid, 'INV-1089'),
('f2f86d54-de7a-4319-a301-f78db5ca1d84'::uuid, 'INV-1090'),
('f720eb8e-bb19-41f0-9424-50b9c7844953'::uuid, 'INV-1091'),
('dbf7e6ea-6859-422e-9eb3-56ec6e820e47'::uuid, 'INV-1092'),
('8302c095-65a1-4129-b445-577406a82a1b'::uuid, 'INV-1093'),
('8c90139a-374d-4827-bfcc-6e050b8adc25'::uuid, 'INV-1094'),
('0dacb303-45a9-41dd-b08e-6d3d1954a79e'::uuid, 'INV-1095'),
('ac4bc2ce-caae-4da3-9699-40b413776d8d'::uuid, 'INV-1096'),
('be30db4e-35ea-46a2-812f-b9b7f9fa812c'::uuid, 'INV-1097'),
('f1649764-ad02-418f-bcf2-d8bb847e7e6d'::uuid, 'INV-1098'),
('ffd33cde-e16c-435d-a26e-9f1f2b894299'::uuid, 'INV-1099'),
('a9c9fc68-ca07-4e46-b699-a2ac2326a478'::uuid, 'INV-1100'),
('7715e833-d39e-4304-8925-5e3858523280'::uuid, 'INV-1101'),
('459f5e09-f6ea-405e-9b2d-ece4daeca3f5'::uuid, 'INV-1102'),
('72d81173-a0ab-471f-ad49-37af6e449c69'::uuid, 'INV-1103'),
('8536d8c4-8a92-47ea-98e6-8c286348edaf'::uuid, 'INV-1104'),
('f53054b5-16ed-423d-a759-c062dc4d04ca'::uuid, 'INV-1105'),
('e8eb8e8e-3aff-4196-ab9b-9b1c1441f94b'::uuid, 'INV-1106'),
('33c5bf53-1315-4f30-b211-d1c5ecce90b3'::uuid, 'INV-1107'),
('088722b3-5c56-4978-a7ae-e58b40c2dd15'::uuid, 'INV-1108'),
('2013f592-59d5-4dac-acd9-a4098cb89119'::uuid, 'INV-1109'),
('aca40ca5-583a-48d6-8bf7-c78b3629c2de'::uuid, 'INV-1110'),
('d221f256-6b29-4d97-a797-ff131a577d86'::uuid, 'INV-1111'),
('5b7d3b23-70e3-486a-b79e-1ce1b56ee8c9'::uuid, 'INV-1112')
) AS v(id, inv_no)
WHERE s.id = v.id;

-- Update DK tenant soldering jobs
UPDATE soldering_engraving_jobs AS s
SET 
  invoice_number = v.inv_no,
  invoice_no = v.inv_no
FROM (VALUES
('f7f50d30-0c0b-4e94-982f-804d315c1e89'::uuid, 'INV-1002'),
('4bbc58d7-467c-4f0b-94d9-2d8bd1a26afe'::uuid, 'INV-1003'),
('53305814-40aa-4b62-8422-97542eb0098b'::uuid, 'INV-1004'),
('ba2ced01-02c1-4211-ac94-b8c9a53300b1'::uuid, 'INV-1005')
) AS v(id, inv_no)
WHERE s.id = v.id;

-- Set next invoice number for MS Gold
UPDATE organizations
SET next_invoice_number = 'INV-1113'
WHERE id = '00000000-0000-0000-0000-000000000000';

-- Set next invoice number for DK
UPDATE organizations
SET next_invoice_number = 'INV-1006'
WHERE id = '004ae35b-5197-4ae2-ab27-b62cd8069a7f';
