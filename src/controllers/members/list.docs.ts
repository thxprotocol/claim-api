/**
 * @swagger
 * /members:
 *   get:
 *     tags:
 *       - Members
 *     description: Provides a list of all members in the pool.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *     responses:
 *        '200':
 *          description: OK
 *          content: application/json
 *          schema:
 *                type: array
 *                items:
 *                  type: string
 *                  description: The address of the member
 *        '400':
 *           $ref: '#/components/responses/400'
 *        '401':
 *           $ref: '#/components/responses/401'
 *        '403':
 *           description: Forbidden. Your account does not have access to this pool.
 *        '404':
 *           description: Not Found. Address is not a member.
 *        '500':
 *           $ref: '#/components/responses/500'
 *        '502':
 *           $ref: '#/components/responses/502'
 */
