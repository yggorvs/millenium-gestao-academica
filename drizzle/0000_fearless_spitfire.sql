CREATE TABLE `assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`class_id` text NOT NULL,
	`date` text NOT NULL,
	`title` text NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`lesson_id` text NOT NULL,
	`enrollment_id` text NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_lesson_enrollment` ON `attendance` (`lesson_id`,`enrollment_id`);--> statement-breakpoint
CREATE TABLE `classes` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`course_id` text NOT NULL,
	`name` text NOT NULL,
	`teacher` text NOT NULL,
	`schedule` text NOT NULL,
	`capacity` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`hours` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`student_id` text NOT NULL,
	`class_id` text NOT NULL,
	`enrolled_on` text NOT NULL,
	`ended_on` text,
	`amount` real NOT NULL,
	`installments` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`contract` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enrollment_student_class` ON `enrollments` (`student_id`,`class_id`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `grades` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`assessment_id` text NOT NULL,
	`enrollment_id` text NOT NULL,
	`score` real NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `grade_assessment_enrollment` ON `grades` (`assessment_id`,`enrollment_id`);--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`class_id` text NOT NULL,
	`date` text NOT NULL,
	`topic` text NOT NULL,
	`attendance_saved` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`document` text DEFAULT '' NOT NULL,
	`birth` text DEFAULT '' NOT NULL,
	`guardian` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL
);
