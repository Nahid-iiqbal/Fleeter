--
-- PostgreSQL database dump
--

\restrict GcqLiO7PEalKInbUnu8EfFZzTLeqaHwia75R89SJYd1FVA431KFeogroM4lE3nn

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: user_account; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.user_account VALUES (1, 'admin', 'admin@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'admin', 'System Administrator', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (3, 'manager', 'manager@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'manager', 'Sarah Jenkins', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (4, 'apex_ops', 'apex.ops@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'manager', 'Tom Reilly', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (6, 'leo_h', 'driver2@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'driver', 'Leo Hernandez', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (7, 'priya_k', 'driver3@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'driver', 'Priya Khan', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (8, 'danny_o', 'driver4@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'driver', 'Danny Osei', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (9, 'fatima_r', 'driver5@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'driver', 'Fatima Rahman', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (10, 'metro_boss', 'owner2@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'owner', 'Daniel Sullivan', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (11, 'metro_dispatch', 'metro.dispatch@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'manager', 'Nina Patel', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (12, 'metro_ops', 'metro.ops@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'manager', 'Carlos Diaz', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (13, 'amir_s', 'amir.s@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'driver', 'Amir Siddiqui', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (14, 'grace_l', 'grace.l@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'driver', 'Grace Lin', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (15, 'victor_m', 'victor.m@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'driver', 'Victor Mensah', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (16, 'hana_t', 'hana.t@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'driver', 'Hana Tanaka', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (17, 'oscar_p', 'oscar.p@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'driver', 'Oscar Pereira', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (18, 'greenvalley_boss', 'owner3@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'owner', 'Olivia Bennett', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (19, 'gv_dispatch', 'gv.dispatch@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'manager', 'Amara Okafor', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (20, 'gv_ops', 'gv.ops@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'manager', 'Ben Turner', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (21, 'sam_c', 'sam.c@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'driver', 'Samuel Chowdhury', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (22, 'wei_z', 'wei.z@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'driver', 'Wei Zhang', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (23, 'ines_v', 'ines.v@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'driver', 'Ines Varela', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (24, 'kwame_a', 'kwame.a@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'driver', 'Kwame Asante', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (25, 'julia_f', 'julia.f@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'driver', 'Julia Ferreira', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (26, 'pending_driver1', 'pending.driver1@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'driver', 'Noah Bennett', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (27, 'pending_driver2', 'pending.driver2@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'driver', 'Elena Vasquez', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (28, 'pending_manager1', 'pending.manager1@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'manager', 'Ravi Shankar', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (29, 'rejected_driver1', 'rejected.driver1@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'driver', 'Miguel Torres', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (30, 'solo_driver', 'solo.driver@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'driver', 'Yusuf Demir', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (31, 'no_profile_driver', 'no.profile.driver@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'driver', 'Jordan Blake', NULL, NULL, NULL, 'light', true, true, NULL, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (5, 'marcus_w', 'driver@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'driver', 'Marcus Wright', NULL, NULL, NULL, 'light', true, true, '2026-09-25 23:38:52.606116+06', '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (2, 'apex_boss', 'owner@fleeter.com', '$2b$10$JQ9PUTIDzjwK5q9.ynNGSe2FFjO0edgmjFspTI.E7Oq3vCPZCuW5K', 'owner', 'Adrian Mitchell', NULL, NULL, NULL, 'light', true, true, '2026-09-25 23:39:01.251138+06', '2026-09-25 23:38:07.901885+06');
INSERT INTO public.user_account VALUES (32, 'mdnahid2243@gmail.com', 'mdnahid2243@gmail.com', '$2b$10$Bgd0TBjOHLP0NJMGs9z.HuhjlMkhqQnYQI/lrzp4/PZ5TV0azbiSe', 'owner', 'Nahid Iqbal', NULL, NULL, NULL, 'light', true, true, '2026-09-26 01:36:24.632282+06', '2026-09-26 01:36:17.898201+06');


--
-- Data for Name: owner_profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.owner_profile VALUES (1, 2, 'Apex Logistics Inc.');
INSERT INTO public.owner_profile VALUES (2, 10, 'Metro Transport Co.');
INSERT INTO public.owner_profile VALUES (3, 18, 'Green Valley Freight');
INSERT INTO public.owner_profile VALUES (4, 32, NULL);


--
-- Data for Name: company_request; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.company_request VALUES (1, 26, 1, 'driver', 'Long-haul experience, available immediately.', 'pending', NULL, NULL, '2026-09-20 23:38:07.901885+06');
INSERT INTO public.company_request VALUES (2, 27, 2, 'driver', NULL, 'pending', NULL, NULL, '2026-09-20 23:38:07.901885+06');
INSERT INTO public.company_request VALUES (3, 28, 3, 'manager', '8 years dispatch experience, references available.', 'pending', NULL, NULL, '2026-09-20 23:38:07.901885+06');
INSERT INTO public.company_request VALUES (4, 29, 1, 'driver', 'Interested in joining your fleet.', 'rejected', 2, '2026-09-13 23:38:07.901885+06', '2026-09-11 23:38:07.901885+06');


--
-- Data for Name: driver; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.driver VALUES (2, 6, 1, 'Leo Hernandez', '555-0111', 'available', '2026-03-19', '2026-09-25 23:38:07.901885+06');
INSERT INTO public.driver VALUES (3, 7, 1, 'Priya Khan', '555-0112', 'available', '2026-06-22', '2026-09-25 23:38:07.901885+06');
INSERT INTO public.driver VALUES (4, 8, 1, 'Danny Osei', '555-0113', 'on_leave', '2025-08-21', '2026-09-25 23:38:07.901885+06');
INSERT INTO public.driver VALUES (5, 9, 1, 'Fatima Rahman', '555-0114', 'suspended', '2025-11-29', '2026-09-25 23:38:07.901885+06');
INSERT INTO public.driver VALUES (6, 13, 2, 'Amir Siddiqui', '555-0210', 'dispatched', '2025-05-13', '2026-09-25 23:38:07.901885+06');
INSERT INTO public.driver VALUES (7, 14, 2, 'Grace Lin', '555-0211', 'available', '2026-02-27', '2026-09-25 23:38:07.901885+06');
INSERT INTO public.driver VALUES (8, 15, 2, 'Victor Mensah', '555-0212', 'available', '2026-04-28', '2026-09-25 23:38:07.901885+06');
INSERT INTO public.driver VALUES (9, 16, 2, 'Hana Tanaka', '555-0213', 'available', '2026-07-27', '2026-09-25 23:38:07.901885+06');
INSERT INTO public.driver VALUES (10, 17, 2, 'Oscar Pereira', '555-0214', 'terminated', '2024-10-25', '2026-09-25 23:38:07.901885+06');
INSERT INTO public.driver VALUES (11, 21, 3, 'Samuel Chowdhury', '555-0310', 'available', '2025-09-10', '2026-09-25 23:38:07.901885+06');
INSERT INTO public.driver VALUES (12, 22, 3, 'Wei Zhang', '555-0311', 'dispatched', '2026-05-08', '2026-09-25 23:38:07.901885+06');
INSERT INTO public.driver VALUES (13, 23, 3, 'Ines Varela', '555-0312', 'available', '2026-07-07', '2026-09-25 23:38:07.901885+06');
INSERT INTO public.driver VALUES (14, 24, 3, 'Kwame Asante', '555-0313', 'available', '2026-08-11', '2026-09-25 23:38:07.901885+06');
INSERT INTO public.driver VALUES (15, 25, 3, 'Julia Ferreira', '555-0314', 'on_leave', '2026-01-08', '2026-09-25 23:38:07.901885+06');
INSERT INTO public.driver VALUES (16, 26, NULL, 'Noah Bennett', '555-0500', 'available', '2026-09-20', '2026-09-25 23:38:07.901885+06');
INSERT INTO public.driver VALUES (17, 27, NULL, 'Elena Vasquez', '555-0501', 'available', '2026-09-22', '2026-09-25 23:38:07.901885+06');
INSERT INTO public.driver VALUES (18, 29, NULL, 'Miguel Torres', '555-0503', 'available', '2026-08-16', '2026-09-25 23:38:07.901885+06');
INSERT INTO public.driver VALUES (19, 30, NULL, 'Yusuf Demir', '555-0504', 'available', '2026-09-24', '2026-09-25 23:38:07.901885+06');
INSERT INTO public.driver VALUES (1, 5, 1, 'Marcus Wright', '555-0110', 'available', '2025-01-13', '2026-09-25 23:38:07.901885+06');


--
-- Data for Name: driver_document; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.driver_document VALUES (1, 1, 'driving_license', 'DL-11001', '2024-04-08', '2026-09-20', true, NULL);
INSERT INTO public.driver_document VALUES (2, 2, 'driving_license', 'DL-12001', '2024-04-08', '2026-10-05', false, NULL);
INSERT INTO public.driver_document VALUES (3, 3, 'driving_license', 'DL-13001', '2024-04-08', '2029-03-13', false, NULL);
INSERT INTO public.driver_document VALUES (4, 4, 'driving_license', 'DL-14001', '2024-04-08', '2029-03-13', false, NULL);
INSERT INTO public.driver_document VALUES (5, 5, 'driving_license', 'DL-15001', '2024-04-08', '2029-03-13', false, NULL);
INSERT INTO public.driver_document VALUES (6, 6, 'driving_license', 'DL-26001', '2024-04-08', '2026-09-20', true, NULL);
INSERT INTO public.driver_document VALUES (7, 7, 'driving_license', 'DL-27001', '2024-04-08', '2026-10-05', false, NULL);
INSERT INTO public.driver_document VALUES (8, 8, 'driving_license', 'DL-28001', '2024-04-08', '2029-03-13', false, NULL);
INSERT INTO public.driver_document VALUES (9, 9, 'driving_license', 'DL-29001', '2024-04-08', '2029-03-13', false, NULL);
INSERT INTO public.driver_document VALUES (10, 10, 'driving_license', 'DL-210001', '2024-04-08', '2029-03-13', false, NULL);
INSERT INTO public.driver_document VALUES (11, 11, 'driving_license', 'DL-311001', '2024-04-08', '2026-09-20', true, NULL);
INSERT INTO public.driver_document VALUES (12, 12, 'driving_license', 'DL-312001', '2024-04-08', '2026-10-05', false, NULL);
INSERT INTO public.driver_document VALUES (13, 13, 'driving_license', 'DL-313001', '2024-04-08', '2029-03-13', false, NULL);
INSERT INTO public.driver_document VALUES (14, 14, 'driving_license', 'DL-314001', '2024-04-08', '2029-03-13', false, NULL);
INSERT INTO public.driver_document VALUES (15, 15, 'driving_license', 'DL-315001', '2024-04-08', '2029-03-13', false, NULL);
INSERT INTO public.driver_document VALUES (16, 16, 'driving_license', 'DL-TEST-16-001', '2024-04-08', '2027-09-25', false, NULL);
INSERT INTO public.driver_document VALUES (17, 17, 'driving_license', 'DL-TEST-17-001', '2024-04-08', '2027-09-25', false, NULL);
INSERT INTO public.driver_document VALUES (18, 18, 'driving_license', 'DL-TEST-18-001', '2024-04-08', '2027-09-25', false, NULL);
INSERT INTO public.driver_document VALUES (19, 19, 'driving_license', 'DL-TEST-19-001', '2024-04-08', '2027-09-25', false, NULL);


--
-- Data for Name: route; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.route VALUES (1, 1, 'Northern Cargo Run', 'Warehouse A', 'Port Terminal', 45.50, 60, true);
INSERT INTO public.route VALUES (2, 1, 'City Distribution Loop', 'Central Depot', 'Downtown Retail Hub', 22.00, 40, true);
INSERT INTO public.route VALUES (3, 1, 'Cross-Border Freight', 'Warehouse A', 'Benapole Border Checkpoint', 260.00, 300, true);
INSERT INTO public.route VALUES (4, 2, 'Airport Cargo Express', 'Metro Depot', 'International Airport Cargo Wing', 18.30, 30, true);
INSERT INTO public.route VALUES (5, 2, 'Suburban Delivery Circuit', 'Metro Depot', 'Suburban Retail Park', 34.00, 55, true);
INSERT INTO public.route VALUES (6, 2, 'Industrial Zone Shuttle', 'Metro Depot', 'Riverside Industrial Zone', 27.50, 45, true);
INSERT INTO public.route VALUES (7, 3, 'Highland Produce Run', 'Green Valley Yard', 'Highland Wholesale Market', 62.00, 80, true);
INSERT INTO public.route VALUES (8, 3, 'Coastal Cold Chain', 'Green Valley Yard', 'Coastal Cold Storage Facility', 88.00, 105, true);
INSERT INTO public.route VALUES (9, 3, 'Regional Hub Transfer', 'Green Valley Yard', 'Regional Distribution Hub', 40.00, 55, true);


--
-- Data for Name: vehicle; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.vehicle VALUES (2, 1, 'ABC-9876', 'Ford', 'van', 'Transit', 2024, 3000, 'petrol', 'good', 'available', NULL);
INSERT INTO public.vehicle VALUES (3, 1, 'APX-4410', 'Mercedes-Benz', 'truck', 'Actros', 2021, 18000, 'diesel', 'in_maintenance', 'unavailable', NULL);
INSERT INTO public.vehicle VALUES (4, 1, 'APX-7702', 'Toyota', 'pickup', 'Hilux', 2022, 1000, 'diesel', 'good', 'available', NULL);
INSERT INTO public.vehicle VALUES (5, 1, 'APX-9981', 'Isuzu', 'truck', 'NPR', 2019, 8000, 'diesel', 'retired', 'unavailable', NULL);
INSERT INTO public.vehicle VALUES (6, 2, 'MTC-1001', 'Hino', 'truck', '500 Series', 2022, 12000, 'diesel', 'good', 'dispatched', NULL);
INSERT INTO public.vehicle VALUES (7, 2, 'MTC-1002', 'Toyota', 'van', 'HiAce', 2023, 2500, 'petrol', 'good', 'available', NULL);
INSERT INTO public.vehicle VALUES (8, 2, 'MTC-1003', 'Volvo', 'truck', 'FM11', 2020, 16000, 'diesel', 'good', 'available', NULL);
INSERT INTO public.vehicle VALUES (9, 2, 'MTC-1004', 'Suzuki', 'pickup', 'Carry', 2024, 800, 'petrol', 'good', 'available', NULL);
INSERT INTO public.vehicle VALUES (10, 2, 'MTC-1005', 'Isuzu', 'truck', 'Elf', 2018, 7000, 'diesel', 'retired', 'unavailable', NULL);
INSERT INTO public.vehicle VALUES (11, 3, 'GVF-2201', 'Scania', 'truck', 'R450', 2023, 20000, 'diesel', 'good', 'available', NULL);
INSERT INTO public.vehicle VALUES (12, 3, 'GVF-2202', 'Nissan', 'van', 'NV350', 2022, 2800, 'petrol', 'good', 'dispatched', NULL);
INSERT INTO public.vehicle VALUES (13, 3, 'GVF-2203', 'Mitsubishi', 'truck', 'Fuso Fighter', 2021, 11000, 'diesel', 'good', 'available', NULL);
INSERT INTO public.vehicle VALUES (14, 3, 'GVF-2204', 'Honda', 'pickup', 'Ridgeline', 2024, 900, 'petrol', 'good', 'available', NULL);
INSERT INTO public.vehicle VALUES (15, 3, 'GVF-2205', 'MAN', 'truck', 'TGX', 2019, 17000, 'diesel', 'in_maintenance', 'unavailable', NULL);
INSERT INTO public.vehicle VALUES (1, 1, 'XYZ-1234', 'Volvo', 'truck', 'FH16', 2023, 15000, 'diesel', 'good', 'available', NULL);


--
-- Data for Name: trip; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.trip VALUES (1, 1, 1, 1, 1, NULL, NULL, '2026-09-05 23:38:07.901885+06', '2026-09-06 23:38:07.901885+06', 'completed', 'cargo', 'Delivered on schedule.', 3);
INSERT INTO public.trip VALUES (2, 1, 1, 1, 2, NULL, NULL, '2026-08-21 23:38:07.901885+06', '2026-08-22 23:38:07.901885+06', 'completed', 'cargo', NULL, 3);
INSERT INTO public.trip VALUES (3, 1, 1, 1, 3, NULL, NULL, '2026-08-06 23:38:07.901885+06', '2026-08-07 23:38:07.901885+06', 'completed', 'cargo', NULL, 3);
INSERT INTO public.trip VALUES (4, 1, 1, 1, 2, NULL, NULL, '2026-09-27 23:38:07.901885+06', NULL, 'scheduled', 'cargo', 'Scheduled regional dispatch', 3);
INSERT INTO public.trip VALUES (5, 1, 2, 2, 1, NULL, NULL, '2026-09-03 23:38:07.901885+06', '2026-09-04 23:38:07.901885+06', 'completed', 'cargo', 'Delivered on schedule.', 3);
INSERT INTO public.trip VALUES (6, 1, 2, 2, 2, NULL, NULL, '2026-08-19 23:38:07.901885+06', '2026-08-20 23:38:07.901885+06', 'completed', 'cargo', NULL, 3);
INSERT INTO public.trip VALUES (7, 1, 2, 2, 3, NULL, NULL, '2026-08-04 23:38:07.901885+06', '2026-08-05 23:38:07.901885+06', 'completed', 'cargo', NULL, 3);
INSERT INTO public.trip VALUES (8, 1, 2, 2, 3, NULL, NULL, '2026-09-28 23:38:07.901885+06', NULL, 'scheduled', 'cargo', 'Scheduled regional dispatch', 3);
INSERT INTO public.trip VALUES (9, 1, 3, 3, 1, NULL, NULL, '2026-09-01 23:38:07.901885+06', '2026-09-02 23:38:07.901885+06', 'completed', 'cargo', 'Delivered on schedule.', 3);
INSERT INTO public.trip VALUES (10, 1, 3, 3, 2, NULL, NULL, '2026-08-17 23:38:07.901885+06', '2026-08-18 23:38:07.901885+06', 'completed', 'cargo', NULL, 3);
INSERT INTO public.trip VALUES (11, 1, 3, 3, 3, NULL, NULL, '2026-08-02 23:38:07.901885+06', '2026-08-03 23:38:07.901885+06', 'completed', 'cargo', NULL, 3);
INSERT INTO public.trip VALUES (12, 1, 3, 3, 1, NULL, NULL, '2026-09-29 23:38:07.901885+06', NULL, 'scheduled', 'cargo', 'Scheduled regional dispatch', 3);
INSERT INTO public.trip VALUES (13, 1, 4, 4, 1, NULL, NULL, '2026-08-30 23:38:07.901885+06', '2026-08-31 23:38:07.901885+06', 'completed', 'cargo', 'Delivered on schedule.', 3);
INSERT INTO public.trip VALUES (14, 1, 4, 4, 2, NULL, NULL, '2026-08-15 23:38:07.901885+06', '2026-08-16 23:38:07.901885+06', 'completed', 'cargo', NULL, 3);
INSERT INTO public.trip VALUES (15, 1, 4, 4, 3, NULL, NULL, '2026-07-31 23:38:07.901885+06', '2026-08-01 23:38:07.901885+06', 'completed', 'cargo', NULL, 3);
INSERT INTO public.trip VALUES (16, 1, 4, 4, 2, NULL, NULL, '2026-09-30 23:38:07.901885+06', NULL, 'scheduled', 'cargo', 'Scheduled regional dispatch', 3);
INSERT INTO public.trip VALUES (17, 1, 5, 5, 1, NULL, NULL, '2026-08-28 23:38:07.901885+06', '2026-08-29 23:38:07.901885+06', 'completed', 'cargo', 'Delivered on schedule.', 3);
INSERT INTO public.trip VALUES (18, 1, 5, 5, 2, NULL, NULL, '2026-08-13 23:38:07.901885+06', '2026-08-14 23:38:07.901885+06', 'completed', 'cargo', NULL, 3);
INSERT INTO public.trip VALUES (19, 1, 5, 5, 3, NULL, NULL, '2026-07-29 23:38:07.901885+06', '2026-07-30 23:38:07.901885+06', 'completed', 'cargo', NULL, 3);
INSERT INTO public.trip VALUES (20, 1, 5, 5, 3, NULL, NULL, '2026-10-01 23:38:07.901885+06', NULL, 'scheduled', 'cargo', 'Scheduled regional dispatch', 3);
INSERT INTO public.trip VALUES (22, 2, 6, 6, 4, NULL, NULL, '2026-09-05 23:38:07.901885+06', '2026-09-06 23:38:07.901885+06', 'completed', 'cargo', 'Delivered on schedule.', 11);
INSERT INTO public.trip VALUES (23, 2, 6, 6, 5, NULL, NULL, '2026-08-21 23:38:07.901885+06', '2026-08-22 23:38:07.901885+06', 'completed', 'cargo', NULL, 11);
INSERT INTO public.trip VALUES (24, 2, 6, 6, 6, NULL, NULL, '2026-08-06 23:38:07.901885+06', '2026-08-07 23:38:07.901885+06', 'completed', 'cargo', NULL, 11);
INSERT INTO public.trip VALUES (25, 2, 6, 6, 5, NULL, NULL, '2026-09-27 23:38:07.901885+06', NULL, 'scheduled', 'cargo', 'Scheduled regional dispatch', 11);
INSERT INTO public.trip VALUES (26, 2, 7, 7, 4, NULL, NULL, '2026-09-03 23:38:07.901885+06', '2026-09-04 23:38:07.901885+06', 'completed', 'cargo', 'Delivered on schedule.', 11);
INSERT INTO public.trip VALUES (27, 2, 7, 7, 5, NULL, NULL, '2026-08-19 23:38:07.901885+06', '2026-08-20 23:38:07.901885+06', 'completed', 'cargo', NULL, 11);
INSERT INTO public.trip VALUES (28, 2, 7, 7, 6, NULL, NULL, '2026-08-04 23:38:07.901885+06', '2026-08-05 23:38:07.901885+06', 'completed', 'cargo', NULL, 11);
INSERT INTO public.trip VALUES (29, 2, 7, 7, 6, NULL, NULL, '2026-09-28 23:38:07.901885+06', NULL, 'scheduled', 'cargo', 'Scheduled regional dispatch', 11);
INSERT INTO public.trip VALUES (30, 2, 8, 8, 4, NULL, NULL, '2026-09-01 23:38:07.901885+06', '2026-09-02 23:38:07.901885+06', 'completed', 'cargo', 'Delivered on schedule.', 11);
INSERT INTO public.trip VALUES (31, 2, 8, 8, 5, NULL, NULL, '2026-08-17 23:38:07.901885+06', '2026-08-18 23:38:07.901885+06', 'completed', 'cargo', NULL, 11);
INSERT INTO public.trip VALUES (32, 2, 8, 8, 6, NULL, NULL, '2026-08-02 23:38:07.901885+06', '2026-08-03 23:38:07.901885+06', 'completed', 'cargo', NULL, 11);
INSERT INTO public.trip VALUES (33, 2, 8, 8, 4, NULL, NULL, '2026-09-29 23:38:07.901885+06', NULL, 'scheduled', 'cargo', 'Scheduled regional dispatch', 11);
INSERT INTO public.trip VALUES (34, 2, 9, 9, 4, NULL, NULL, '2026-08-30 23:38:07.901885+06', '2026-08-31 23:38:07.901885+06', 'completed', 'cargo', 'Delivered on schedule.', 11);
INSERT INTO public.trip VALUES (35, 2, 9, 9, 5, NULL, NULL, '2026-08-15 23:38:07.901885+06', '2026-08-16 23:38:07.901885+06', 'completed', 'cargo', NULL, 11);
INSERT INTO public.trip VALUES (36, 2, 9, 9, 6, NULL, NULL, '2026-07-31 23:38:07.901885+06', '2026-08-01 23:38:07.901885+06', 'completed', 'cargo', NULL, 11);
INSERT INTO public.trip VALUES (37, 2, 9, 9, 5, NULL, NULL, '2026-09-30 23:38:07.901885+06', NULL, 'scheduled', 'cargo', 'Scheduled regional dispatch', 11);
INSERT INTO public.trip VALUES (38, 2, 10, 10, 4, NULL, NULL, '2026-08-28 23:38:07.901885+06', '2026-08-29 23:38:07.901885+06', 'completed', 'cargo', 'Delivered on schedule.', 11);
INSERT INTO public.trip VALUES (39, 2, 10, 10, 5, NULL, NULL, '2026-08-13 23:38:07.901885+06', '2026-08-14 23:38:07.901885+06', 'completed', 'cargo', NULL, 11);
INSERT INTO public.trip VALUES (40, 2, 10, 10, 6, NULL, NULL, '2026-07-29 23:38:07.901885+06', '2026-07-30 23:38:07.901885+06', 'completed', 'cargo', NULL, 11);
INSERT INTO public.trip VALUES (41, 2, 10, 10, 6, NULL, NULL, '2026-10-01 23:38:07.901885+06', NULL, 'scheduled', 'cargo', 'Scheduled regional dispatch', 11);
INSERT INTO public.trip VALUES (42, 2, 6, 6, 4, NULL, NULL, '2026-09-25 22:38:07.901885+06', NULL, 'in_progress', 'cargo', 'Live delivery in progress', 11);
INSERT INTO public.trip VALUES (43, 3, 11, 11, 7, NULL, NULL, '2026-09-05 23:38:07.901885+06', '2026-09-06 23:38:07.901885+06', 'completed', 'cargo', 'Delivered on schedule.', 19);
INSERT INTO public.trip VALUES (44, 3, 11, 11, 8, NULL, NULL, '2026-08-21 23:38:07.901885+06', '2026-08-22 23:38:07.901885+06', 'completed', 'cargo', NULL, 19);
INSERT INTO public.trip VALUES (45, 3, 11, 11, 9, NULL, NULL, '2026-08-06 23:38:07.901885+06', '2026-08-07 23:38:07.901885+06', 'completed', 'cargo', NULL, 19);
INSERT INTO public.trip VALUES (46, 3, 11, 11, 8, NULL, NULL, '2026-09-27 23:38:07.901885+06', NULL, 'scheduled', 'cargo', 'Scheduled regional dispatch', 19);
INSERT INTO public.trip VALUES (47, 3, 12, 12, 7, NULL, NULL, '2026-09-03 23:38:07.901885+06', '2026-09-04 23:38:07.901885+06', 'completed', 'cargo', 'Delivered on schedule.', 19);
INSERT INTO public.trip VALUES (48, 3, 12, 12, 8, NULL, NULL, '2026-08-19 23:38:07.901885+06', '2026-08-20 23:38:07.901885+06', 'completed', 'cargo', NULL, 19);
INSERT INTO public.trip VALUES (49, 3, 12, 12, 9, NULL, NULL, '2026-08-04 23:38:07.901885+06', '2026-08-05 23:38:07.901885+06', 'completed', 'cargo', NULL, 19);
INSERT INTO public.trip VALUES (50, 3, 12, 12, 9, NULL, NULL, '2026-09-28 23:38:07.901885+06', NULL, 'scheduled', 'cargo', 'Scheduled regional dispatch', 19);
INSERT INTO public.trip VALUES (51, 3, 13, 13, 7, NULL, NULL, '2026-09-01 23:38:07.901885+06', '2026-09-02 23:38:07.901885+06', 'completed', 'cargo', 'Delivered on schedule.', 19);
INSERT INTO public.trip VALUES (52, 3, 13, 13, 8, NULL, NULL, '2026-08-17 23:38:07.901885+06', '2026-08-18 23:38:07.901885+06', 'completed', 'cargo', NULL, 19);
INSERT INTO public.trip VALUES (53, 3, 13, 13, 9, NULL, NULL, '2026-08-02 23:38:07.901885+06', '2026-08-03 23:38:07.901885+06', 'completed', 'cargo', NULL, 19);
INSERT INTO public.trip VALUES (54, 3, 13, 13, 7, NULL, NULL, '2026-09-29 23:38:07.901885+06', NULL, 'scheduled', 'cargo', 'Scheduled regional dispatch', 19);
INSERT INTO public.trip VALUES (55, 3, 14, 14, 7, NULL, NULL, '2026-08-30 23:38:07.901885+06', '2026-08-31 23:38:07.901885+06', 'completed', 'cargo', 'Delivered on schedule.', 19);
INSERT INTO public.trip VALUES (56, 3, 14, 14, 8, NULL, NULL, '2026-08-15 23:38:07.901885+06', '2026-08-16 23:38:07.901885+06', 'completed', 'cargo', NULL, 19);
INSERT INTO public.trip VALUES (57, 3, 14, 14, 9, NULL, NULL, '2026-07-31 23:38:07.901885+06', '2026-08-01 23:38:07.901885+06', 'completed', 'cargo', NULL, 19);
INSERT INTO public.trip VALUES (58, 3, 14, 14, 8, NULL, NULL, '2026-09-30 23:38:07.901885+06', NULL, 'scheduled', 'cargo', 'Scheduled regional dispatch', 19);
INSERT INTO public.trip VALUES (59, 3, 15, 15, 7, NULL, NULL, '2026-08-28 23:38:07.901885+06', '2026-08-29 23:38:07.901885+06', 'completed', 'cargo', 'Delivered on schedule.', 19);
INSERT INTO public.trip VALUES (60, 3, 15, 15, 8, NULL, NULL, '2026-08-13 23:38:07.901885+06', '2026-08-14 23:38:07.901885+06', 'completed', 'cargo', NULL, 19);
INSERT INTO public.trip VALUES (61, 3, 15, 15, 9, NULL, NULL, '2026-07-29 23:38:07.901885+06', '2026-07-30 23:38:07.901885+06', 'completed', 'cargo', NULL, 19);
INSERT INTO public.trip VALUES (62, 3, 15, 15, 9, NULL, NULL, '2026-10-01 23:38:07.901885+06', NULL, 'scheduled', 'cargo', 'Scheduled regional dispatch', 19);
INSERT INTO public.trip VALUES (63, 3, 11, 11, 7, NULL, NULL, '2026-09-25 22:38:07.901885+06', NULL, 'in_progress', 'cargo', 'Live delivery in progress', 19);
INSERT INTO public.trip VALUES (21, 1, 1, 1, 1, NULL, NULL, '2026-09-25 22:38:07.901885+06', '2026-09-25 23:38:56.394263+06', 'completed', 'cargo', 'Live delivery in progress', 3);


--
-- Data for Name: fuel_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.fuel_log VALUES (1, 1, 1, '2026-09-06 23:38:07.901885+06', 95.71, 1.40, 15015, 'Highway Fuel Station', 5);
INSERT INTO public.fuel_log VALUES (2, 1, 3, '2026-08-07 23:38:07.901885+06', 63.93, 1.42, 15270, 'Highway Fuel Station', 5);
INSERT INTO public.fuel_log VALUES (3, 2, 5, '2026-09-04 23:38:07.901885+06', 41.82, 1.47, 11929, 'Highway Fuel Station', 6);
INSERT INTO public.fuel_log VALUES (4, 2, 7, '2026-08-05 23:38:07.901885+06', 68.76, 1.74, 12310, 'Highway Fuel Station', 6);
INSERT INTO public.fuel_log VALUES (5, 3, 9, '2026-09-02 23:38:07.901885+06', 71.51, 1.57, 14090, 'Highway Fuel Station', 7);
INSERT INTO public.fuel_log VALUES (6, 3, 11, '2026-08-03 23:38:07.901885+06', 91.46, 1.56, 14650, 'Highway Fuel Station', 7);
INSERT INTO public.fuel_log VALUES (7, 4, 13, '2026-08-31 23:38:07.901885+06', 86.77, 1.62, 13453, 'Highway Fuel Station', 8);
INSERT INTO public.fuel_log VALUES (8, 4, 15, '2026-08-01 23:38:07.901885+06', 50.74, 1.41, 13839, 'Highway Fuel Station', 8);
INSERT INTO public.fuel_log VALUES (9, 5, 17, '2026-08-29 23:38:07.901885+06', 76.96, 1.64, 12424, 'Highway Fuel Station', 9);
INSERT INTO public.fuel_log VALUES (10, 5, 19, '2026-07-30 23:38:07.901885+06', 56.22, 1.46, 12666, 'Highway Fuel Station', 9);
INSERT INTO public.fuel_log VALUES (11, 6, 22, '2026-09-06 23:38:07.901885+06', 48.29, 1.42, 11055, 'Highway Fuel Station', 13);
INSERT INTO public.fuel_log VALUES (12, 6, 24, '2026-08-07 23:38:07.901885+06', 87.26, 1.68, 11456, 'Highway Fuel Station', 13);
INSERT INTO public.fuel_log VALUES (13, 7, 26, '2026-09-04 23:38:07.901885+06', 51.87, 1.44, 11760, 'Highway Fuel Station', 14);
INSERT INTO public.fuel_log VALUES (14, 7, 28, '2026-08-05 23:38:07.901885+06', 51.06, 1.75, 12286, 'Highway Fuel Station', 14);
INSERT INTO public.fuel_log VALUES (15, 8, 30, '2026-09-02 23:38:07.901885+06', 40.57, 1.39, 14781, 'Highway Fuel Station', 15);
INSERT INTO public.fuel_log VALUES (16, 8, 32, '2026-08-03 23:38:07.901885+06', 62.40, 1.73, 15094, 'Highway Fuel Station', 15);
INSERT INTO public.fuel_log VALUES (17, 9, 34, '2026-08-31 23:38:07.901885+06', 78.17, 1.50, 12231, 'Highway Fuel Station', 16);
INSERT INTO public.fuel_log VALUES (18, 9, 36, '2026-08-01 23:38:07.901885+06', 46.00, 1.54, 12528, 'Highway Fuel Station', 16);
INSERT INTO public.fuel_log VALUES (19, 10, 38, '2026-08-29 23:38:07.901885+06', 49.70, 1.53, 14270, 'Highway Fuel Station', 17);
INSERT INTO public.fuel_log VALUES (20, 10, 40, '2026-07-30 23:38:07.901885+06', 65.00, 1.65, 14773, 'Highway Fuel Station', 17);
INSERT INTO public.fuel_log VALUES (21, 11, 43, '2026-09-06 23:38:07.901885+06', 99.99, 1.50, 15103, 'Highway Fuel Station', 21);
INSERT INTO public.fuel_log VALUES (22, 11, 45, '2026-08-07 23:38:07.901885+06', 69.04, 1.37, 15346, 'Highway Fuel Station', 21);
INSERT INTO public.fuel_log VALUES (23, 12, 47, '2026-09-04 23:38:07.901885+06', 85.15, 1.50, 14046, 'Highway Fuel Station', 22);
INSERT INTO public.fuel_log VALUES (24, 12, 49, '2026-08-05 23:38:07.901885+06', 43.59, 1.60, 14242, 'Highway Fuel Station', 22);
INSERT INTO public.fuel_log VALUES (25, 13, 51, '2026-09-02 23:38:07.901885+06', 48.18, 1.71, 12347, 'Highway Fuel Station', 23);
INSERT INTO public.fuel_log VALUES (26, 13, 53, '2026-08-03 23:38:07.901885+06', 72.39, 1.70, 12789, 'Highway Fuel Station', 23);
INSERT INTO public.fuel_log VALUES (27, 14, 55, '2026-08-31 23:38:07.901885+06', 69.86, 1.67, 14648, 'Highway Fuel Station', 24);
INSERT INTO public.fuel_log VALUES (28, 14, 57, '2026-08-01 23:38:07.901885+06', 44.17, 1.53, 15176, 'Highway Fuel Station', 24);
INSERT INTO public.fuel_log VALUES (29, 15, 59, '2026-08-29 23:38:07.901885+06', 76.13, 1.38, 10823, 'Highway Fuel Station', 25);
INSERT INTO public.fuel_log VALUES (30, 15, 61, '2026-07-30 23:38:07.901885+06', 40.85, 1.63, 11266, 'Highway Fuel Station', 25);


--
-- Data for Name: incident; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.incident VALUES (1, 3, '2026-08-07 23:38:07.901885+06', 'breakdown', 'Vehicle experienced a flat tire mid-route; roadside assistance called.', 'minor', 45.00, 'Fleet Dispatch', 5, true, NULL);
INSERT INTO public.incident VALUES (2, 5, '2026-09-04 23:38:07.901885+06', 'accident', 'Minor collision while reversing at the loading dock. No injuries.', 'moderate', 620.50, 'Local Traffic Police', 6, false, NULL);
INSERT INTO public.incident VALUES (3, 24, '2026-08-07 23:38:07.901885+06', 'breakdown', 'Vehicle experienced a flat tire mid-route; roadside assistance called.', 'minor', 45.00, 'Fleet Dispatch', 13, true, NULL);
INSERT INTO public.incident VALUES (4, 26, '2026-09-04 23:38:07.901885+06', 'accident', 'Minor collision while reversing at the loading dock. No injuries.', 'moderate', 620.50, 'Local Traffic Police', 14, false, NULL);
INSERT INTO public.incident VALUES (5, 45, '2026-08-07 23:38:07.901885+06', 'breakdown', 'Vehicle experienced a flat tire mid-route; roadside assistance called.', 'minor', 45.00, 'Fleet Dispatch', 21, true, NULL);
INSERT INTO public.incident VALUES (6, 47, '2026-09-04 23:38:07.901885+06', 'accident', 'Minor collision while reversing at the loading dock. No injuries.', 'moderate', 620.50, 'Local Traffic Police', 22, false, NULL);


--
-- Data for Name: vendor; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.vendor VALUES (1, 1, 'Apex Certified Workshop', 'General Repair', 'Workshop Manager', '555-9000', 'Industrial Area, Unit 4', '2026-09-25 23:38:07.901885');
INSERT INTO public.vendor VALUES (2, 2, 'Metro Certified Workshop', 'General Repair', 'Workshop Manager', '555-9000', 'Industrial Area, Unit 4', '2026-09-25 23:38:07.901885');
INSERT INTO public.vendor VALUES (3, 3, 'Green Certified Workshop', 'General Repair', 'Workshop Manager', '555-9000', 'Industrial Area, Unit 4', '2026-09-25 23:38:07.901885');


--
-- Data for Name: maintenance; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.maintenance VALUES (1, 1, 1, '2026-07-27', 'routine', 'Scheduled oil change and multi-point inspection.', 85.00, 'Apex Certified Workshop', 'J. Alvarez', 14770, '2026-10-25', 20270, 3);
INSERT INTO public.maintenance VALUES (2, 2, 1, '2026-07-17', 'routine', 'Scheduled oil change and multi-point inspection.', 90.00, 'Apex Certified Workshop', 'J. Alvarez', 11810, '2026-10-25', 17310, 3);
INSERT INTO public.maintenance VALUES (3, 3, 1, '2026-07-07', 'routine', 'Scheduled oil change and multi-point inspection.', 95.00, 'Apex Certified Workshop', 'J. Alvarez', 14150, '2026-10-25', 19650, 3);
INSERT INTO public.maintenance VALUES (4, 3, 1, '2026-09-23', 'repair', 'Transmission diagnostics and repair in progress.', 950.00, 'Apex Certified Workshop', 'R. Costa', 14650, NULL, NULL, 3);
INSERT INTO public.maintenance VALUES (5, 4, 1, '2026-06-27', 'routine', 'Scheduled oil change and multi-point inspection.', 100.00, 'Apex Certified Workshop', 'J. Alvarez', 13339, '2026-10-25', 18839, 3);
INSERT INTO public.maintenance VALUES (6, 5, 1, '2026-06-17', 'routine', 'Scheduled oil change and multi-point inspection.', 105.00, 'Apex Certified Workshop', 'J. Alvarez', 12166, '2026-10-25', 17666, 3);
INSERT INTO public.maintenance VALUES (7, 6, 2, '2026-07-27', 'routine', 'Scheduled oil change and multi-point inspection.', 85.00, 'Metro Certified Workshop', 'J. Alvarez', 10956, '2026-10-25', 16456, 11);
INSERT INTO public.maintenance VALUES (8, 7, 2, '2026-07-17', 'routine', 'Scheduled oil change and multi-point inspection.', 90.00, 'Metro Certified Workshop', 'J. Alvarez', 11786, '2026-10-25', 17286, 11);
INSERT INTO public.maintenance VALUES (9, 8, 2, '2026-07-07', 'routine', 'Scheduled oil change and multi-point inspection.', 95.00, 'Metro Certified Workshop', 'J. Alvarez', 14594, '2026-10-25', 20094, 11);
INSERT INTO public.maintenance VALUES (10, 9, 2, '2026-06-27', 'routine', 'Scheduled oil change and multi-point inspection.', 100.00, 'Metro Certified Workshop', 'J. Alvarez', 12028, '2026-10-25', 17528, 11);
INSERT INTO public.maintenance VALUES (11, 10, 2, '2026-06-17', 'routine', 'Scheduled oil change and multi-point inspection.', 105.00, 'Metro Certified Workshop', 'J. Alvarez', 14273, '2026-10-25', 19773, 11);
INSERT INTO public.maintenance VALUES (12, 11, 3, '2026-07-27', 'routine', 'Scheduled oil change and multi-point inspection.', 85.00, 'Green Certified Workshop', 'J. Alvarez', 14846, '2026-10-25', 20346, 19);
INSERT INTO public.maintenance VALUES (13, 12, 3, '2026-07-17', 'routine', 'Scheduled oil change and multi-point inspection.', 90.00, 'Green Certified Workshop', 'J. Alvarez', 13742, '2026-10-25', 19242, 19);
INSERT INTO public.maintenance VALUES (14, 13, 3, '2026-07-07', 'routine', 'Scheduled oil change and multi-point inspection.', 95.00, 'Green Certified Workshop', 'J. Alvarez', 12289, '2026-10-25', 17789, 19);
INSERT INTO public.maintenance VALUES (15, 14, 3, '2026-06-27', 'routine', 'Scheduled oil change and multi-point inspection.', 100.00, 'Green Certified Workshop', 'J. Alvarez', 14676, '2026-10-25', 20176, 19);
INSERT INTO public.maintenance VALUES (16, 15, 3, '2026-06-17', 'routine', 'Scheduled oil change and multi-point inspection.', 105.00, 'Green Certified Workshop', 'J. Alvarez', 10766, '2026-10-25', 16266, 19);
INSERT INTO public.maintenance VALUES (17, 15, 3, '2026-09-23', 'repair', 'Transmission diagnostics and repair in progress.', 950.00, 'Green Certified Workshop', 'R. Costa', 11266, NULL, NULL, 19);


--
-- Data for Name: manager_profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.manager_profile VALUES (1, 3, 1, 'Sarah Jenkins', 'EMP-001', '555-0100', 'Operations');
INSERT INTO public.manager_profile VALUES (2, 4, 1, 'Tom Reilly', 'EMP-002', '555-0101', 'Logistics');
INSERT INTO public.manager_profile VALUES (3, 11, 2, 'Nina Patel', 'MT-001', '555-0200', 'Operations');
INSERT INTO public.manager_profile VALUES (4, 12, 2, 'Carlos Diaz', 'MT-002', '555-0201', 'Fleet Ops');
INSERT INTO public.manager_profile VALUES (5, 19, 3, 'Amara Okafor', 'GV-001', '555-0300', 'Dispatch');
INSERT INTO public.manager_profile VALUES (6, 20, 3, 'Ben Turner', 'GV-002', '555-0301', 'Fleet Ops');
INSERT INTO public.manager_profile VALUES (7, 28, NULL, 'Ravi Shankar', NULL, '555-0502', 'Dispatch');


--
-- Data for Name: message; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: system_alert; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.system_alert VALUES (8, 1, 'refuel', 'fuel_log', 9, 'Vehicle refuelled - APX-9981', 'Highway Fuel Station', 'Fuel log: 76.96 liters at 1.64 per liter. Station: Highway Fuel Station. Odometer: 12424 km. Mark as resolved once the check is complete.', 'low', '2026-09-25 23:38:19.959388+06', NULL, false, NULL, '{"liters": "76.96", "trip_id": 17, "driver_id": 5, "vehicle_id": 5, "driver_name": "Fatima Rahman", "odometer_km": 12424, "station_name": "Highway Fuel Station", "vehicle_name": "APX-9981 Isuzu NPR", "cost_per_liter": "1.64", "vehicle_registration": "APX-9981"}');
INSERT INTO public.system_alert VALUES (1, 1, 'incident', 'incident', 2, 'Incident on trip #5', 'Vehicle ABC-9876 · Leo Hernandez', 'Incident type: accident.
Severity: moderate.
Reported to: Local Traffic Police.
Damage cost: 620.50.
Driver notes: Minor collision while reversing at the loading dock. No injuries.', 'moderate', '2026-09-25 23:38:19.952215+06', NULL, false, NULL, '{"trip_id": 5, "driver_id": 2, "image_url": null, "vehicle_id": 2, "damage_cost": "620.50", "driver_name": "Leo Hernandez", "reported_to": "Local Traffic Police", "vehicle_name": "ABC-9876 Ford Transit", "incident_type": "accident"}');
INSERT INTO public.system_alert VALUES (5, 1, 'refuel', 'fuel_log', 3, 'Vehicle refuelled - ABC-9876', 'Highway Fuel Station', 'Fuel log: 41.82 liters at 1.47 per liter. Station: Highway Fuel Station. Odometer: 11929 km. Mark as resolved once the check is complete.', 'low', '2026-09-25 23:38:19.957353+06', NULL, false, NULL, '{"liters": "41.82", "trip_id": 5, "driver_id": 2, "vehicle_id": 2, "driver_name": "Leo Hernandez", "odometer_km": 11929, "station_name": "Highway Fuel Station", "vehicle_name": "ABC-9876 Ford Transit", "cost_per_liter": "1.47", "vehicle_registration": "ABC-9876"}');
INSERT INTO public.system_alert VALUES (6, 1, 'refuel', 'fuel_log', 5, 'Vehicle refuelled - APX-4410', 'Highway Fuel Station', 'Fuel log: 71.51 liters at 1.57 per liter. Station: Highway Fuel Station. Odometer: 14090 km. Mark as resolved once the check is complete.', 'low', '2026-09-25 23:38:19.9581+06', NULL, false, NULL, '{"liters": "71.51", "trip_id": 9, "driver_id": 3, "vehicle_id": 3, "driver_name": "Priya Khan", "odometer_km": 14090, "station_name": "Highway Fuel Station", "vehicle_name": "APX-4410 Mercedes-Benz Actros", "cost_per_liter": "1.57", "vehicle_registration": "APX-4410"}');
INSERT INTO public.system_alert VALUES (7, 1, 'refuel', 'fuel_log', 7, 'Vehicle refuelled - APX-7702', 'Highway Fuel Station', 'Fuel log: 86.77 liters at 1.62 per liter. Station: Highway Fuel Station. Odometer: 13453 km. Mark as resolved once the check is complete.', 'low', '2026-09-25 23:38:19.958781+06', NULL, false, NULL, '{"liters": "86.77", "trip_id": 13, "driver_id": 4, "vehicle_id": 4, "driver_name": "Danny Osei", "odometer_km": 13453, "station_name": "Highway Fuel Station", "vehicle_name": "APX-7702 Toyota Hilux", "cost_per_liter": "1.62", "vehicle_registration": "APX-7702"}');
INSERT INTO public.system_alert VALUES (2, 1, 'driver_document_expired', 'driver_document', 1, 'Marcus Wright driver document expired', 'driving_license', 'The driving_license for Marcus Wright has missing or expired date information.', 'high', '2026-09-25 23:38:19.955474+06', '2026-09-20 00:00:00+06', false, NULL, '{"driver_id": 1, "date_issue": null, "issue_date": "2024-04-07T18:00:00.000Z", "date_expiry": "expired", "document_id": 1, "driver_name": "Marcus Wright", "expiry_date": "2026-09-19T18:00:00.000Z", "document_type": "driving_license"}');
INSERT INTO public.system_alert VALUES (3, 1, 'vehicle_document_expired', 'vehicle_document', 2, 'Vehicle document expired for XYZ-1234', 'insurance', 'The insurance for vehicle XYZ-1234 expired on 2026-09-14.', 'high', '2026-09-25 23:38:19.956138+06', '2026-09-15 00:00:00+06', false, NULL, '{"vehicle_id": 1, "document_type": "insurance"}');
INSERT INTO public.system_alert VALUES (4, 1, 'refuel', 'fuel_log', 1, 'Vehicle refuelled - XYZ-1234', 'Highway Fuel Station', 'Fuel log: 95.71 liters at 1.40 per liter. Station: Highway Fuel Station. Odometer: 15015 km. Mark as resolved once the check is complete.', 'low', '2026-09-25 23:38:19.956687+06', NULL, false, NULL, '{"liters": "95.71", "trip_id": 1, "driver_id": 1, "vehicle_id": 1, "driver_name": "Marcus Wright", "odometer_km": 15015, "station_name": "Highway Fuel Station", "vehicle_name": "XYZ-1234 Volvo FH16", "cost_per_liter": "1.40", "vehicle_registration": "XYZ-1234"}');
INSERT INTO public.system_alert VALUES (9, 1, 'refuel', 'fuel_log', 2, 'Vehicle refuelled - XYZ-1234', 'Highway Fuel Station', 'Fuel log: 63.93 liters at 1.42 per liter. Station: Highway Fuel Station. Odometer: 15270 km. Mark as resolved once the check is complete.', 'low', '2026-09-25 23:38:19.959942+06', NULL, false, NULL, '{"liters": "63.93", "trip_id": 3, "driver_id": 1, "vehicle_id": 1, "driver_name": "Marcus Wright", "odometer_km": 15270, "station_name": "Highway Fuel Station", "vehicle_name": "XYZ-1234 Volvo FH16", "cost_per_liter": "1.42", "vehicle_registration": "XYZ-1234"}');
INSERT INTO public.system_alert VALUES (10, 1, 'refuel', 'fuel_log', 4, 'Vehicle refuelled - ABC-9876', 'Highway Fuel Station', 'Fuel log: 68.76 liters at 1.74 per liter. Station: Highway Fuel Station. Odometer: 12310 km. Mark as resolved once the check is complete.', 'low', '2026-09-25 23:38:19.960523+06', NULL, false, NULL, '{"liters": "68.76", "trip_id": 7, "driver_id": 2, "vehicle_id": 2, "driver_name": "Leo Hernandez", "odometer_km": 12310, "station_name": "Highway Fuel Station", "vehicle_name": "ABC-9876 Ford Transit", "cost_per_liter": "1.74", "vehicle_registration": "ABC-9876"}');
INSERT INTO public.system_alert VALUES (11, 1, 'refuel', 'fuel_log', 6, 'Vehicle refuelled - APX-4410', 'Highway Fuel Station', 'Fuel log: 91.46 liters at 1.56 per liter. Station: Highway Fuel Station. Odometer: 14650 km. Mark as resolved once the check is complete.', 'low', '2026-09-25 23:38:19.96117+06', NULL, false, NULL, '{"liters": "91.46", "trip_id": 11, "driver_id": 3, "vehicle_id": 3, "driver_name": "Priya Khan", "odometer_km": 14650, "station_name": "Highway Fuel Station", "vehicle_name": "APX-4410 Mercedes-Benz Actros", "cost_per_liter": "1.56", "vehicle_registration": "APX-4410"}');
INSERT INTO public.system_alert VALUES (12, 1, 'refuel', 'fuel_log', 8, 'Vehicle refuelled - APX-7702', 'Highway Fuel Station', 'Fuel log: 50.74 liters at 1.41 per liter. Station: Highway Fuel Station. Odometer: 13839 km. Mark as resolved once the check is complete.', 'low', '2026-09-25 23:38:19.961714+06', NULL, false, NULL, '{"liters": "50.74", "trip_id": 15, "driver_id": 4, "vehicle_id": 4, "driver_name": "Danny Osei", "odometer_km": 13839, "station_name": "Highway Fuel Station", "vehicle_name": "APX-7702 Toyota Hilux", "cost_per_liter": "1.41", "vehicle_registration": "APX-7702"}');
INSERT INTO public.system_alert VALUES (13, 1, 'refuel', 'fuel_log', 10, 'Vehicle refuelled - APX-9981', 'Highway Fuel Station', 'Fuel log: 56.22 liters at 1.46 per liter. Station: Highway Fuel Station. Odometer: 12666 km. Mark as resolved once the check is complete.', 'low', '2026-09-25 23:38:19.962272+06', NULL, false, NULL, '{"liters": "56.22", "trip_id": 19, "driver_id": 5, "vehicle_id": 5, "driver_name": "Fatima Rahman", "odometer_km": 12666, "station_name": "Highway Fuel Station", "vehicle_name": "APX-9981 Isuzu NPR", "cost_per_liter": "1.46", "vehicle_registration": "APX-9981"}');


--
-- Data for Name: telemetry_y2026m08; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: telemetry_y2026m09; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.telemetry_y2026m09 VALUES (1, 1, 21, '0101000020E610000066B22E8E459B564023971A82EFD23740', 46.61, NULL, 90, '2026-09-25 23:18:07.901885+06');
INSERT INTO public.telemetry_y2026m09 VALUES (2, 1, 21, '0101000020E6100000F3499DA0C89B5640E68C43DE7ED53740', 36.87, NULL, 87, '2026-09-25 23:23:07.901885+06');
INSERT INTO public.telemetry_y2026m09 VALUES (3, 1, 21, '0101000020E610000081E10BB34B9C5640A8826C3A0ED83740', 62.83, NULL, 84, '2026-09-25 23:28:07.901885+06');
INSERT INTO public.telemetry_y2026m09 VALUES (4, 1, 21, '0101000020E61000000E797AC5CE9C56406B7895969DDA3740', 46.68, NULL, 81, '2026-09-25 23:33:07.901885+06');
INSERT INTO public.telemetry_y2026m09 VALUES (5, 1, 21, '0101000020E61000009B10E9D7519D56402D6EBEF22CDD3740', 65.92, NULL, 78, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.telemetry_y2026m09 VALUES (6, 6, 42, '0101000020E61000007CE4496FDF995640260ED2B964CE3740', 62.72, NULL, 90, '2026-09-25 23:18:07.901885+06');
INSERT INTO public.telemetry_y2026m09 VALUES (7, 6, 42, '0101000020E6100000097CB881629A5640E903FB15F4D03740', 73.68, NULL, 87, '2026-09-25 23:23:07.901885+06');
INSERT INTO public.telemetry_y2026m09 VALUES (8, 6, 42, '0101000020E610000097132794E59A5640ABF9237283D33740', 37.78, NULL, 84, '2026-09-25 23:28:07.901885+06');
INSERT INTO public.telemetry_y2026m09 VALUES (9, 6, 42, '0101000020E610000024AB95A6689B56406EEF4CCE12D63740', 72.55, NULL, 81, '2026-09-25 23:33:07.901885+06');
INSERT INTO public.telemetry_y2026m09 VALUES (10, 6, 42, '0101000020E6100000B14204B9EB9B564030E5752AA2D83740', 45.24, NULL, 78, '2026-09-25 23:38:07.901885+06');
INSERT INTO public.telemetry_y2026m09 VALUES (11, 11, 63, '0101000020E6100000C69F59291F9A5640851B7F4605CA3740', 37.42, NULL, 90, '2026-09-25 23:18:07.901885+06');
INSERT INTO public.telemetry_y2026m09 VALUES (12, 11, 63, '0101000020E61000005337C83BA29A56404811A8A294CC3740', 68.10, NULL, 87, '2026-09-25 23:23:07.901885+06');
INSERT INTO public.telemetry_y2026m09 VALUES (13, 11, 63, '0101000020E6100000E1CE364E259B56400A07D1FE23CF3740', 54.79, NULL, 84, '2026-09-25 23:28:07.901885+06');
INSERT INTO public.telemetry_y2026m09 VALUES (14, 11, 63, '0101000020E61000006E66A560A89B5640CDFCF95AB3D13740', 45.14, NULL, 81, '2026-09-25 23:33:07.901885+06');
INSERT INTO public.telemetry_y2026m09 VALUES (15, 11, 63, '0101000020E6100000FBFD13732B9C56408FF222B742D43740', 68.05, NULL, 78, '2026-09-25 23:38:07.901885+06');


--
-- Data for Name: token_blacklist; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.token_blacklist VALUES ('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo1LCJyb2xlIjoiZHJpdmVyIiwidXNlcm5hbWUiOiJtYXJjdXNfdyIsImlhdCI6MTc5MDM1NzkzMiwiZXhwIjoxNzkwNDAxMTMyfQ.EsEyT_hOGF1eGoPJHDjhFEMu_4cRIjdfhrgHxa8oC1Y', '2026-09-26 11:38:52+06');


--
-- Data for Name: vehicle_document; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.vehicle_document VALUES (1, 1, 'registration', 'REG-XYZ-1234', '2024-10-25', '2027-10-30', false, NULL);
INSERT INTO public.vehicle_document VALUES (2, 1, 'insurance', 'INS-XYZ-1234', '2025-11-29', '2026-09-15', true, NULL);
INSERT INTO public.vehicle_document VALUES (3, 1, 'fitness_certificate', 'FIT-XYZ-1234', '2026-03-29', '2027-03-29', false, NULL);
INSERT INTO public.vehicle_document VALUES (4, 2, 'registration', 'REG-ABC-9876', '2024-10-25', '2027-10-30', false, NULL);
INSERT INTO public.vehicle_document VALUES (5, 2, 'insurance', 'INS-ABC-9876', '2025-11-29', '2026-09-30', false, NULL);
INSERT INTO public.vehicle_document VALUES (6, 2, 'fitness_certificate', 'FIT-ABC-9876', '2026-03-29', '2027-03-29', false, NULL);
INSERT INTO public.vehicle_document VALUES (7, 3, 'registration', 'REG-APX-4410', '2024-10-25', '2027-10-30', false, NULL);
INSERT INTO public.vehicle_document VALUES (8, 3, 'insurance', 'INS-APX-4410', '2025-11-29', '2027-04-13', false, NULL);
INSERT INTO public.vehicle_document VALUES (9, 3, 'fitness_certificate', 'FIT-APX-4410', '2026-03-29', '2027-03-29', false, NULL);
INSERT INTO public.vehicle_document VALUES (10, 4, 'registration', 'REG-APX-7702', '2024-10-25', '2027-10-30', false, NULL);
INSERT INTO public.vehicle_document VALUES (11, 4, 'insurance', 'INS-APX-7702', '2025-11-29', '2027-04-13', false, NULL);
INSERT INTO public.vehicle_document VALUES (12, 4, 'fitness_certificate', 'FIT-APX-7702', '2026-03-29', '2027-03-29', false, NULL);
INSERT INTO public.vehicle_document VALUES (13, 5, 'registration', 'REG-APX-9981', '2024-10-25', '2027-10-30', false, NULL);
INSERT INTO public.vehicle_document VALUES (14, 5, 'insurance', 'INS-APX-9981', '2025-11-29', '2027-04-13', false, NULL);
INSERT INTO public.vehicle_document VALUES (15, 5, 'fitness_certificate', 'FIT-APX-9981', '2026-03-29', '2027-03-29', false, NULL);
INSERT INTO public.vehicle_document VALUES (16, 6, 'registration', 'REG-MTC-1001', '2024-10-25', '2027-10-30', false, NULL);
INSERT INTO public.vehicle_document VALUES (17, 6, 'insurance', 'INS-MTC-1001', '2025-11-29', '2026-09-15', true, NULL);
INSERT INTO public.vehicle_document VALUES (18, 6, 'fitness_certificate', 'FIT-MTC-1001', '2026-03-29', '2027-03-29', false, NULL);
INSERT INTO public.vehicle_document VALUES (19, 7, 'registration', 'REG-MTC-1002', '2024-10-25', '2027-10-30', false, NULL);
INSERT INTO public.vehicle_document VALUES (20, 7, 'insurance', 'INS-MTC-1002', '2025-11-29', '2026-09-30', false, NULL);
INSERT INTO public.vehicle_document VALUES (21, 7, 'fitness_certificate', 'FIT-MTC-1002', '2026-03-29', '2027-03-29', false, NULL);
INSERT INTO public.vehicle_document VALUES (22, 8, 'registration', 'REG-MTC-1003', '2024-10-25', '2027-10-30', false, NULL);
INSERT INTO public.vehicle_document VALUES (23, 8, 'insurance', 'INS-MTC-1003', '2025-11-29', '2027-04-13', false, NULL);
INSERT INTO public.vehicle_document VALUES (24, 8, 'fitness_certificate', 'FIT-MTC-1003', '2026-03-29', '2027-03-29', false, NULL);
INSERT INTO public.vehicle_document VALUES (25, 9, 'registration', 'REG-MTC-1004', '2024-10-25', '2027-10-30', false, NULL);
INSERT INTO public.vehicle_document VALUES (26, 9, 'insurance', 'INS-MTC-1004', '2025-11-29', '2027-04-13', false, NULL);
INSERT INTO public.vehicle_document VALUES (27, 9, 'fitness_certificate', 'FIT-MTC-1004', '2026-03-29', '2027-03-29', false, NULL);
INSERT INTO public.vehicle_document VALUES (28, 10, 'registration', 'REG-MTC-1005', '2024-10-25', '2027-10-30', false, NULL);
INSERT INTO public.vehicle_document VALUES (29, 10, 'insurance', 'INS-MTC-1005', '2025-11-29', '2027-04-13', false, NULL);
INSERT INTO public.vehicle_document VALUES (30, 10, 'fitness_certificate', 'FIT-MTC-1005', '2026-03-29', '2027-03-29', false, NULL);
INSERT INTO public.vehicle_document VALUES (31, 11, 'registration', 'REG-GVF-2201', '2024-10-25', '2027-10-30', false, NULL);
INSERT INTO public.vehicle_document VALUES (32, 11, 'insurance', 'INS-GVF-2201', '2025-11-29', '2026-09-15', true, NULL);
INSERT INTO public.vehicle_document VALUES (33, 11, 'fitness_certificate', 'FIT-GVF-2201', '2026-03-29', '2027-03-29', false, NULL);
INSERT INTO public.vehicle_document VALUES (34, 12, 'registration', 'REG-GVF-2202', '2024-10-25', '2027-10-30', false, NULL);
INSERT INTO public.vehicle_document VALUES (35, 12, 'insurance', 'INS-GVF-2202', '2025-11-29', '2026-09-30', false, NULL);
INSERT INTO public.vehicle_document VALUES (36, 12, 'fitness_certificate', 'FIT-GVF-2202', '2026-03-29', '2027-03-29', false, NULL);
INSERT INTO public.vehicle_document VALUES (37, 13, 'registration', 'REG-GVF-2203', '2024-10-25', '2027-10-30', false, NULL);
INSERT INTO public.vehicle_document VALUES (38, 13, 'insurance', 'INS-GVF-2203', '2025-11-29', '2027-04-13', false, NULL);
INSERT INTO public.vehicle_document VALUES (39, 13, 'fitness_certificate', 'FIT-GVF-2203', '2026-03-29', '2027-03-29', false, NULL);
INSERT INTO public.vehicle_document VALUES (40, 14, 'registration', 'REG-GVF-2204', '2024-10-25', '2027-10-30', false, NULL);
INSERT INTO public.vehicle_document VALUES (41, 14, 'insurance', 'INS-GVF-2204', '2025-11-29', '2027-04-13', false, NULL);
INSERT INTO public.vehicle_document VALUES (42, 14, 'fitness_certificate', 'FIT-GVF-2204', '2026-03-29', '2027-03-29', false, NULL);
INSERT INTO public.vehicle_document VALUES (43, 15, 'registration', 'REG-GVF-2205', '2024-10-25', '2027-10-30', false, NULL);
INSERT INTO public.vehicle_document VALUES (44, 15, 'insurance', 'INS-GVF-2205', '2025-11-29', '2027-04-13', false, NULL);
INSERT INTO public.vehicle_document VALUES (45, 15, 'fitness_certificate', 'FIT-GVF-2205', '2026-03-29', '2027-03-29', false, NULL);


--
-- Data for Name: vehicle_image; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: vehicle_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.vehicle_status_history VALUES (1, 1, 'dispatched', 'available', '2026-09-25 23:38:56.394263');


--
-- Name: company_request_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.company_request_request_id_seq', 4, true);


--
-- Name: driver_document_document_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.driver_document_document_id_seq', 19, true);


--
-- Name: driver_driver_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.driver_driver_id_seq', 19, true);


--
-- Name: fuel_log_fuel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fuel_log_fuel_id_seq', 30, true);


--
-- Name: incident_incident_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.incident_incident_id_seq', 6, true);


--
-- Name: maintenance_maintenance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.maintenance_maintenance_id_seq', 17, true);


--
-- Name: manager_profile_manager_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.manager_profile_manager_id_seq', 7, true);


--
-- Name: message_message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.message_message_id_seq', 1, false);


--
-- Name: owner_profile_owner_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.owner_profile_owner_id_seq', 4, true);


--
-- Name: route_route_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.route_route_id_seq', 9, true);


--
-- Name: system_alert_alert_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_alert_alert_id_seq', 819, true);


--
-- Name: trip_trip_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.trip_trip_id_seq', 63, true);


--
-- Name: user_account_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_account_user_id_seq', 32, true);


--
-- Name: vehicle_document_document_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vehicle_document_document_id_seq', 45, true);


--
-- Name: vehicle_image_image_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vehicle_image_image_id_seq', 1, false);


--
-- Name: vehicle_status_history_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vehicle_status_history_history_id_seq', 1, true);


--
-- Name: vehicle_telemetry_telemetry_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vehicle_telemetry_telemetry_id_seq', 15, true);


--
-- Name: vehicle_vehicle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vehicle_vehicle_id_seq', 15, true);


--
-- Name: vendor_vendor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vendor_vendor_id_seq', 3, true);


--
-- PostgreSQL database dump complete
--

\unrestrict GcqLiO7PEalKInbUnu8EfFZzTLeqaHwia75R89SJYd1FVA431KFeogroM4lE3nn

