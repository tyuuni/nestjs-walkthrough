CREATE TABLE IF NOT EXISTS users
(
    id              VARCHAR(50)  NOT NULL,
    nfc_card_id     VARCHAR(50)  NOT NULL,
    name            VARCHAR(100) NOT NULL DEFAULT '',
    is_student      BOOLEAN      NOT NULL DEFAULT false,
    is_teacher      BOOLEAN      NOT NULL DEFAULT false,
    teacher_id      VARCHAR(50)  NOT NULL DEFAULT '',
    creation_source INT          NOT NULL DEFAULT 0,
    created_by      VARCHAR(50)  NOT NULL,
    created_at      TIMESTAMP    NOT NULL,
    update_source   INT          NOT NULL DEFAULT 0,
    updated_by      VARCHAR(50)  NOT NULL,
    updated_at      TIMESTAMP    NOT NULL,
    is_deleted      BOOLEAN      NOT NULL DEFAULT false,
    comment         VARCHAR(100) NOT NULL DEFAULT '',
    PRIMARY KEY (id),
    UNIQUE (nfc_card_id)
);

CREATE INDEX IF NOT EXISTS idx_users_teacher_id ON users (teacher_id);

CREATE TABLE IF NOT EXISTS courses
(
    id              VARCHAR(50)  NOT NULL,
    name            VARCHAR(100) NOT NULL DEFAULT '',
    teacher_id      VARCHAR(50)  NOT NULL DEFAULT '',
    creation_source INT          NOT NULL DEFAULT 0,
    created_by      VARCHAR(50)  NOT NULL,
    created_at      TIMESTAMP    NOT NULL,
    update_source   INT          NOT NULL DEFAULT 0,
    updated_by      VARCHAR(50)  NOT NULL,
    updated_at      TIMESTAMP    NOT NULL,
    is_deleted      BOOLEAN      NOT NULL DEFAULT false,
    comment         VARCHAR(100) NOT NULL DEFAULT '',
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses (teacher_id);

CREATE TABLE IF NOT EXISTS course_student_refs
(
    id              VARCHAR(50)  NOT NULL,
    student_id      VARCHAR(50)  NOT NULL,
    course_id       VARCHAR(50)  NOT NULL,
    creation_source INT          NOT NULL DEFAULT 0,
    created_by      VARCHAR(50)  NOT NULL,
    created_at      TIMESTAMP    NOT NULL,
    update_source   INT          NOT NULL DEFAULT 0,
    updated_by      VARCHAR(50)  NOT NULL,
    updated_at      TIMESTAMP    NOT NULL,
    is_deleted      BOOLEAN      NOT NULL DEFAULT false,
    comment         VARCHAR(100) NOT NULL DEFAULT '',
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_course_student_refs_student_id ON course_student_refs (student_id);
CREATE INDEX IF NOT EXISTS idx_course_student_refs_course_id ON course_student_refs (course_id);
