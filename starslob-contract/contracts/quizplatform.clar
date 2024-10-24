(define-data-var quizzes (map uint (tuple 
    (title (string-ascii 100)) 
    (description (string-ascii 200)) 
    (image-url (string-ascii 256))
    (entrance-fee uint) 
    (price-pool uint) 
    (timer uint)
    (organizer principal)
    (is-active bool)
    (is-ended bool)
    (visibility (string-ascii 10))
    (questions (list 100 (tuple
        (question-text (string-ascii 256))
        (question-img (string-ascii 256))
        (options (list 4 (string-ascii 50)))
        (correct-option uint))))
    (rewards (list 3 (tuple (label (string-ascii 10)) (value uint)))))))

(define-data-var quiz-participants (map (tuple (quiz-id uint) (participant principal)) 
    (tuple
        (num-questions-passed uint)
        (num-questions-failed uint)
        (points uint)
        (grade uint)
        (attempts uint))))

(define-data-var quiz-participant-addresses (map uint (list 100 principal)))

(define-data-var quiz-id-counter uint u0)

(define-event quiz-created (id uint organizer principal title (string-ascii 100)))
(define-event participant-added (quiz-id uint participant principal))
(define-event rewards-distributed (quiz-id uint participants (list 100 principal) amounts (list 100 uint)))

;; Create a quiz
(define-public (create-quiz (title (string-ascii 100)) 
                            (description (string-ascii 200)) 
                            (image-url (string-ascii 256)) 
                            (entrance-fee uint) 
                            (price-pool uint) 
                            (timer uint) 
                            (questions (list 100 (tuple 
                                (question-text (string-ascii 256)) 
                                (question-img (string-ascii 256)) 
                                (options (list 4 (string-ascii 50))) 
                                (correct-option uint)))) 
                            (rewards (list 3 (tuple (label (string-ascii 10)) (value uint)))) 
                            (visibility (string-ascii 10)))
    (begin
        ;; Increment the quiz ID counter
        (let ((quiz-id (var-get quiz-id-counter)))
            ;; Ensure the price pool is paid by the organizer (tx-sender)
            (stx-transfer? price-pool tx-sender tx-sender)

            ;; Insert the quiz into the map
            (map-insert quizzes quiz-id (tuple
                (title title)
                (description description)
                (image-url image-url)
                (entrance-fee entrance-fee)
                (price-pool price-pool)
                (timer timer)
                (organizer tx-sender)
                (is-active true)
                (is-ended false)
                (visibility visibility)
                (questions questions)
                (rewards rewards)))

            ;; Emit event
            (emit-event (quiz-created quiz-id tx-sender title))

            ;; Increment the quiz ID counter for the next quiz
            (var-set quiz-id-counter (+ quiz-id u1))
            (ok quiz-id)
        )
    )
)

;; Participants to join a quiz
(define-public (participate-in-quiz (quiz-id uint))
    (let ((quiz (map-get? quizzes quiz-id)))
        (match quiz
            quiz-data
            (begin
                ;; Check if the quiz is active
                (asserts! (get is-active quiz-data) (err "Quiz is not active"))

                ;; Pay entrance fee to the organizer
                (stx-transfer? (get entrance-fee quiz-data) tx-sender (get organizer quiz-data))

                ;; Add participant if not already present
                (let ((participant (map-get? quiz-participants (tuple (quiz-id tx-sender)))))
                    (if participant
                        ;; If participant already exists, increment their attempts
                        (let ((attempts (+ (get attempts participant) u1)))
                            (map-set quiz-participants (tuple (quiz-id tx-sender)) (tuple
                                (num-questions-passed (get num-questions-passed participant))
                                (num-questions-failed (get num-questions-failed participant))
                                (points (get points participant))
                                (grade (get grade participant))
                                (attempts attempts))))
                        ;; If participant does not exist, create a new entry
                        (map-set quiz-participants (tuple (quiz-id tx-sender)) (tuple
                            (num-questions-passed u0)
                            (num-questions-failed u0)
                            (points u0)
                            (grade u0)
                            (attempts u1)))))
                ;; Emit event
                (emit-event (participant-added quiz-id tx-sender))
                (ok "Participant added")
            )
            (err "Quiz not found")
        )
    )
)

;; Submit quiz results
(define-public (submit-quiz-result (quiz-id uint) (grade uint) (num-questions-passed uint) (num-questions-failed uint) (points uint))
    (let ((quiz (map-get? quizzes quiz-id)))
        (match quiz
            quiz-data
            (let ((participant (map-get? quiz-participants (tuple (quiz-id tx-sender)))))
                (asserts! participant (err "Not a participant"))
                ;; Update participant quiz results
                (map-set quiz-participants (tuple (quiz-id tx-sender)) (tuple
                    (num-questions-passed num-questions-passed)
                    (num-questions-failed num-questions-failed)
                    (points points)
                    (grade grade)
                    (attempts (get attempts participant))))
                (ok "Results submitted")
            )
            (err "Quiz not found")
        )
    )
)

;; Distribute rewards
(define-public (distribute-rewards (quiz-id uint) (participants (list 100 principal)) (amounts (list 100 uint)))
    (let ((quiz (map-get? quizzes quiz-id)))
        (match quiz
            quiz-data
            (begin
                ;; Ensure only the quiz organizer can distribute rewards
                (asserts! (is-eq (get organizer quiz-data) tx-sender) (err "Only organizer can distribute rewards"))
                (asserts! (is-eq (len participants) (len amounts)) (err "Mismatch in participants and amounts"))
                
                ;; Transfer rewards
                (let loop ((index u0))
                    (if (< index (len participants))
                        (begin
                            (stx-transfer? (get index amounts) (get organizer quiz-data) (get index participants))
                            (loop (+ index u1)))
                        (ok "Rewards distributed"))))
                ;; Emit event
                (emit-event (rewards-distributed quiz-id participants amounts))
            )
            (err "Quiz not found")
        )
    )
)
