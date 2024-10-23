(define-data-var quizzes (list 100 (tuple 
    (title (string-ascii 100)) 
    (description (string-ascii 200)) 
    (image-url (string-ascii 256))
    (entrance-fee uint) 
    (price-pool uint) 
    (timer uint)
    (organizer principal)
    (is-active bool)
    (is-ended bool)
    (visibility (string-ascii 10))))
    (list 100 (tuple
        (question-text (string-ascii 256))
        (question-img (string-ascii 256))
        (options (list 4 (string-ascii 50)))
        (correct-option uint)))
    (list 3 (tuple (label (string-ascii 10)) (value uint)))))

(define-data-var quiz-participants (map uint principal (tuple
    (num-questions-passed uint)
    (num-questions-failed uint)
    (points uint)
    (grade uint)
    (attempts uint))))

(define-data-var quiz-participant-addresses (map uint (list 100 principal)))

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
        ;; Ensure the price pool is paid by the organizer
        (asserts! (is-eq (tx-sender) (var-get organizer)) (err "Only the organizer can pay"))
        (stx-transfer? price-pool tx-sender (var-get organizer))

        ;; Save the quiz
        (map-insert quizzes (len (var-get quizzes)) (tuple
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
        (print (tuple (id (len (var-get quizzes)) organizer tx-sender title title)))
    )
)

;; Participants to join a quiz
(define-public (participate-in-quiz (quiz-id uint))
    (let ((quiz (map-get? quizzes quiz-id)))
        (asserts! quiz (err "Quiz not found"))
        (asserts! (get is-active quiz) (err "Quiz is not active"))
        (stx-transfer? (get entrance-fee quiz) tx-sender (get organizer quiz))
        
        ;; Add participant if not already present
        (let ((participant (map-get? quiz-participants (tuple (quiz-id tx-sender)))))
            (if participant
                (begin
                    (let ((attempts (+ (get attempts participant) u1)))
                        (map-set quiz-participants (tuple (quiz-id tx-sender)) (tuple
                            (num-questions-passed (get num-questions-passed participant))
                            (num-questions-failed (get num-questions-failed participant))
                            (points (get points participant))
                            (grade (get grade participant))
                            (attempts attempts))))
                (map-set quiz-participants (tuple (quiz-id tx-sender)) (tuple
                    (num-questions-passed u0)
                    (num-questions-failed u0)
                    (points u0)
                    (grade u0)
                    (attempts u1)))))
        (print (tuple (quiz-id quiz-id participant tx-sender)))
    )
)

;; Submit quiz results
(define-public (submit-quiz-result (quiz-id uint) (grade uint) (num-questions-passed uint) (num-questions-failed uint) (points uint))
    (let ((quiz (map-get? quizzes quiz-id)))
        (asserts! quiz (err "Quiz not found"))
        (let ((participant (map-get? quiz-participants (tuple (quiz-id tx-sender)))))
            (asserts! participant (err "Not a participant"))
            (map-set quiz-participants (tuple (quiz-id tx-sender)) (tuple
                (num-questions-passed num-questions-passed)
                (num-questions-failed num-questions-failed)
                (points points)
                (grade grade)
                (attempts (get attempts participant)))))
    )
)

;; Distribute rewards
(define-public (distribute-rewards (quiz-id uint) (participants (list 100 principal)) (amounts (list 100 uint)))
    (let ((quiz (map-get? quizzes quiz-id)))
        (asserts! quiz (err "Quiz not found"))
        (asserts! (is-eq (get organizer quiz) tx-sender) (err "Only organizer can distribute rewards"))
        (asserts! (is-eq (len participants) (len amounts)) (err "Mismatch in participants and amounts"))
        
        ;; Transfer rewards
        (let loop ((index u0))
            (if (< index (len participants))
                (begin
                    (stx-transfer? (get index amounts) (get organizer quiz) (get index participants))
                    (loop (+ index u1)))
                (ok (print "Rewards distributed")))))
    )
)
