"""Added phone number column in users table..

Revision ID: 0f6f5a953ace
Revises: d21be403f096
Create Date: 2025-05-04 01:00:19.133614

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0f6f5a953ace'
down_revision = 'd21be403f096'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('phoneNumber', sa.String(length=20), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('phoneNumber')

    # ### end Alembic commands ###
