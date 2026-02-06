CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION gen_uuid_without_hyphen() 
RETURNS text AS $$
BEGIN
    RETURN REPLACE(uuid_generate_v4()::text, '-', '');
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    teacher1_id text := gen_uuid_without_hyphen();
    teacher2_id text := gen_uuid_without_hyphen();
    student1_id text := gen_uuid_without_hyphen();
    student2_id text := gen_uuid_without_hyphen();
    student3_id text := gen_uuid_without_hyphen();
    course1_id text := gen_uuid_without_hyphen();
    course2_id text := gen_uuid_without_hyphen();
BEGIN
    INSERT INTO users (id, nfc_card_id, name, is_student, is_teacher, teacher_id, creation_source, created_by, created_at, update_source, updated_by, updated_at)
    VALUES 
    (teacher1_id, 'teacher1', 'teacher 1', false, true, '', -1, 'initial data', NOW(), -1, 'initial data', NOW()),
    (teacher2_id, 'teacher2', 'teacher 2', false, true, '', -1, 'initial data', NOW(), -1, 'initial data', NOW());

    INSERT INTO users (id, nfc_card_id, name, is_student, is_teacher, teacher_id, creation_source, created_by, created_at, update_source, updated_by, updated_at)
    VALUES 
    (student1_id, 'student1', 'student 1', true, false, teacher1_id, -1, 'initial data', NOW(), -1, 'initial data', NOW()),
    (student2_id, 'student2', 'student 2', true, false, teacher1_id, -1, 'initial data', NOW(), -1, 'initial data', NOW()),
    (student3_id, 'student3', 'student 3', true, false, teacher2_id, -1, 'initial data', NOW(), -1, 'initial data', NOW());

    INSERT INTO courses (id, name, teacher_id, creation_source, created_by, created_at, update_source, updated_by, updated_at)
    VALUES 
    (course1_id, 'course 1', teacher1_id, -1, 'initial data', NOW(), -1, 'initial data', NOW()),
    (course2_id, 'course 2', teacher2_id, -1, 'initial data', NOW(), -1, 'initial data', NOW());

    INSERT INTO course_student_refs (id, student_id, course_id, creation_source, created_by, created_at, update_source, updated_by, updated_at)
    VALUES 
    (gen_uuid_without_hyphen(), student1_id, course1_id, -1, 'initial data', NOW(), -1, 'initial data', NOW()),
    (gen_uuid_without_hyphen(), student2_id, course1_id, -1, 'initial data', NOW(), -1, 'initial data', NOW()),
    (gen_uuid_without_hyphen(), student3_id, course2_id, -1, 'initial data', NOW(), -1, 'initial data', NOW());

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Data insertion failed: %', SQLERRM;

END $$;

DROP FUNCTION IF EXISTS gen_uuid_without_hyphen();