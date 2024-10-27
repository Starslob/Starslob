;; Define contract name and data variables
(define-data-var quizzes (map uint (tuple
    (title (string-ascii 100))
    (description (string-ascii 200))
    (image-url (string-ascii 256))
    (entrance-fee uint)
    (price-pool uint)
    (remaining-pool uint)
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
    (rewards (list 3 (tuple (label (string-ascii 10)) (value uint))))))

(define-data-var quiz-participants (map (tuple (quiz-id uint) (participant principal))
    (tuple
        (num-questions-passed uint)
        (num-questions-failed uint)
        (points uint)
        (grade uint)
        (is_winner bool)
        (reward uint)
        (attempts uint))))

(define-data-var quiz-id-counter uint u0)
(define-event quiz-created (id uint organizer principal title (string-ascii 100)))
(define-event participant-added (quiz-id uint participant principal))
(define-event rewards-distributed (quiz-id uint participants (list 100 principal) amounts (list 100 uint)))

;; Function to create a quiz
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
        (let ((quiz-id (var-get quiz-id-counter)))
            ;; Transfer price pool to the contract (escrow)
            (stx-transfer? price-pool tx-sender (as-contract tx-sender))

            ;; Insert the quiz with remaining pool set to price pool
            (map-insert quizzes quiz-id (tuple
                (title title)
                (description description)
                (image-url image-url)
                (entrance-fee entrance-fee)
                (price-pool price-pool)
                (remaining-pool price-pool)
                (timer timer)
                (organizer tx-sender)
                (is-active true)
                (is-ended false)
                (visibility visibility)
                (questions questions)
                (rewards rewards)))

            ;; Emit event
            (emit-event (quiz-created quiz-id tx-sender title))

            ;; Increment quiz ID counter
            (var-set quiz-id-counter (+ quiz-id u1))
            (ok quiz-id)
        )
    )
)

;; Function to participate in a quiz
(define-public (participate-in-quiz (quiz-id uint))
    (let ((quiz (map-get? quizzes quiz-id)))
        (match quiz
            quiz-data
            (begin
                (asserts! (get is-active quiz-data) (err "Quiz is not active"))

                ;; Transfer entrance fee to the contract
                (stx-transfer? (get entrance-fee quiz-data) tx-sender (as-contract tx-sender))

                ;; Add participant if not already present
                (let ((participant (map-get? quiz-participants (tuple (quiz-id tx-sender)))))
                    (if participant
                        (let ((attempts (+ (get attempts participant) u1)))
                            (map-set quiz-participants (tuple (quiz-id tx-sender)) (tuple
                                (num-questions-passed (get num-questions-passed participant))
                                (num-questions-failed (get num-questions-failed participant))
                                (points (get points participant))
                                (grade (get grade participant))
                                (is_winner false)
                                (reward u0)
                                (attempts attempts))))
                        (map-set quiz-participants (tuple (quiz-id tx-sender)) (tuple
                            (num-questions-passed u0)
                            (num-questions-failed u0)
                            (points u0)
                            (grade u0)
                            (is_winner false)
                            (reward u0)
                            (attempts u1)))))
                (emit-event (participant-added quiz-id tx-sender))
                (ok "Participant added")
            )
            (err "Quiz not found")
        )
    )
)

;; Function to submit quiz results
(define-public (submit-quiz-result (quiz-id uint) (grade uint) (num-questions-passed uint) (num-questions-failed uint) (points uint) (is_winner bool) (reward uint))
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
                    (is_winner is_winner)
                    (reward reward)
                    (attempts (get attempts participant))))
                
                ;; Deduct reward from remaining pool
                (let ((updated-pool (- (get remaining-pool quiz-data) reward)))
                    (map-set quizzes quiz-id (merge quiz-data (tuple (remaining-pool updated-pool)))))
                (ok "Results submitted")
            )
            (err "Quiz not found")
        )
    )
)

;; Function to distribute rewards
(define-public (distribute-rewards (quiz-id uint))
    (let ((quiz (map-get? quizzes quiz-id)))
        (match quiz
            quiz-data
            (begin
                (asserts! (is-eq (get organizer quiz-data) tx-sender) (err "Only organizer can distribute rewards"))
                
                ;; Filter and send rewards to winners
                (let loop ((index u0) (rewarded u0))
                    (if (< index (len (var-get quiz-participants)))
                        (let ((participant (nth index (var-get quiz-participants)))
                              (reward (get reward participant)))
                            (if (get is_winner participant)
                                (begin
                                    (stx-transfer? reward (as-contract tx-sender) (get participant principal))
                                    (loop (+ index u1) (+ rewarded reward)))
                                (loop (+ index u1) rewarded)))
                        (emit-event (rewards-distributed quiz-id (list 100 participant) (list 100 rewarded)))
                        (ok "Rewards distributed"))
                )
            )
            (err "Quiz not found")
        )
    )
)

;; Function to check the contract balance
(define-read-only (get-balance)
    (ok (stx-get-balance (as-contract tx-sender)))
)
